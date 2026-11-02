import { randomUUID } from 'node:crypto';
import { type EntityManager } from '@mikro-orm/postgresql';

import { WagerTransaction, WagerTransactionKind, LedgerDirection, 
type CreateWagerTransactionProps } from '../../business-logic/entities/wager-transaction.js';

import { WalletLedgerEntry } from '../../business-logic/entities/wallet-ledger-entry.js';

import { WalletRepository } from '../../data-access/repositories/wallet.repository.js';
import { WagerTransactionRepository } from '../../data-access/repositories/wager-transaction.repository.js';
import { WalletLedgerRepository } from '../../data-access/repositories/wallet-ledger.repository.js';

export type ProcessWagerTransactionInput = Omit<
  CreateWagerTransactionProps,
  'id' | 'walletId'
>;

//tratamentos de diversos erros
export class IdempotencyConflictError extends Error {
  constructor() {
    super('Idempotency key was already used with a different payload');
    this.name = 'IdempotencyConflictError';
  }
}

export class DuplicateExternalTransactionError extends Error {
  constructor() {
    super('External transaction ID was already used');
    this.name = 'DuplicateExternalTransactionError';
  }
}

export class WalletNotFoundError extends Error {
  constructor() {
    super('Wallet not found');
    this.name = 'WalletNotFoundError';
  }
}
//processando aposta, seguindo as regras de negócio, como idempotência, 
// verificação de saldo, etc.
export class ProcessWagerTransactionService {
  constructor(private readonly em: EntityManager) {}

  async execute(
    input: ProcessWagerTransactionInput,
  ): Promise<WagerTransaction> {
    if (
      input.kind !== WagerTransactionKind.BET &&
      input.kind !== WagerTransactionKind.WIN &&
      input.kind !== WagerTransactionKind.LOSS
    ) {
      throw new Error('Unsupported transaction kind');
    }

    return this.em.transactional(async (txEm) => {
      // All repositories must use the same transactional EntityManager.
      const walletRepository = new WalletRepository(txEm);
      const transactionRepository = new WagerTransactionRepository(txEm);
      const ledgerRepository = new WalletLedgerRepository(txEm);

      // 1. Check idempotency before performing any financial operation.
      const existing = await transactionRepository.findByIdempotencyKey(
        input.providerId,
        input.idempotencyKey,
      );

      if (existing) {
        if (!existing.matchesPayload(input.payloadHash)) {
          throw new IdempotencyConflictError();
        }

        return existing;
      }

      // 2. Check whether the provider's external transaction ID already exists.
      const duplicateExternalId =
        await transactionRepository.findByProviderAndExternalId(
          input.providerId,
          input.externalTransactionId,
        );

      if (duplicateExternalId) {
        throw new DuplicateExternalTransactionError();
      }

      // 3. Lock the wallet to prevent concurrent balance modifications.
      const wallet =
        await walletRepository.findByPlayerIdAndCurrencyForUpdate(
          input.playerId,
          input.money.currency,
        );

      if (!wallet) {
        throw new WalletNotFoundError();
      }

      // 4. Create the domain transaction.
      const transaction = WagerTransaction.create({
        ...input,
        id: randomUUID(),
        walletId: wallet.id,
      });

      // LOSS does not change the wallet balance.
      if (input.kind === WagerTransactionKind.LOSS) {
        transaction.markProcessed(undefined, new Date());

        await transactionRepository.insert(transaction);

        return transaction;
      }

      const direction = transaction.ledgerDirectionFor();

      const balanceBefore = wallet.balance;

      // 5. Check insufficient funds before attempting the debit.
      if (
        direction === LedgerDirection.DEBIT &&
        balanceBefore.lessThan(input.money)
      ) {
        transaction.reject('INSUFFICIENT_FUNDS');

        await transactionRepository.insert(transaction);

        return transaction;
      }

      // 6. Apply the financial operation to the domain wallet.
      if (direction === LedgerDirection.DEBIT) {
        wallet.debit(input.money);
      } else {
        wallet.credit(input.money);
      }

      // 7. Create the immutable ledger entry.
      const ledgerEntry = WalletLedgerEntry.create({
        id: randomUUID(),
        walletId: wallet.id,
        transactionId: transaction.id,
        direction,
        money: input.money,
        balanceBefore,
      });

      // 8. Mark the transaction as processed.
      transaction.markProcessed(undefined, new Date());

      // 9. Persist all changes within the same database transaction.
      await walletRepository.save(wallet);
      await transactionRepository.insert(transaction);
      await ledgerRepository.insert(ledgerEntry);

      return transaction;
    });
  }
}