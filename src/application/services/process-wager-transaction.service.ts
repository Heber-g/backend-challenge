
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { WagerTransaction, WagerTransactionKind, WagerTransactionStatus,
LedgerDirection, type CreateWagerTransactionProps }
from '../../business-logic/entities/wager-transaction.js';

import { WalletLedgerEntry } from '../../business-logic/entities/wallet-ledger-entry.js';

import { Money } from '../../business-logic/value-objects/money.js';

import { WalletRepository } from '../../data-access/repositories/wallet.repository.js';
import { WagerTransactionRepository } from '../../data-access/repositories/wager-transaction.repository.js';
import { WalletLedgerRepository } from '../../data-access/repositories/wallet-ledger.repository.js';

export type ProcessWagerTransactionInput = Omit<
  CreateWagerTransactionProps,
  'id'
>;

export interface ProcessWagerTransactionResult {
  transaction: WagerTransaction;
  balance: Money;
  idempotentReplay: boolean;
}

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

export class InvalidReferenceError extends Error {
  constructor(message = 'Invalid reference transaction') {
    super(message);
    this.name = 'InvalidReferenceError';
  }
}

export class DuplicateReversalError extends Error {
  constructor() {
    super('Reference transaction has already been reversed');
    this.name = 'DuplicateReversalError';
  }
}

@Injectable()
export class ProcessWagerTransactionService {
  constructor(private readonly em: EntityManager) {}

  async execute(
    input: ProcessWagerTransactionInput,
  ): Promise<ProcessWagerTransactionResult> {
    return this.em.transactional(async (txEm) => {
      const walletRepository = new WalletRepository(txEm);
      const transactionRepository = new WagerTransactionRepository(txEm);
      const ledgerRepository = new WalletLedgerRepository(txEm);

      // 1. Check idempotency.
      const existing = await transactionRepository.findByIdempotencyKey(
        input.providerId,
        input.idempotencyKey,
      );

      if (existing) {
        if (!existing.matchesPayload(input.payloadHash)) {
          throw new IdempotencyConflictError();
        }

        const existingWallet = await walletRepository.findById(
          existing.walletId,
        );

        if (!existingWallet) {
          throw new WalletNotFoundError();
        }

        return {
          transaction: existing,
          balance: existingWallet.balance,
          idempotentReplay: true,
        };
      }

      // 2. Prevent duplicate external transaction IDs.
      const duplicateExternalId =
        await transactionRepository.findByProviderAndExternalId(
          input.providerId,
          input.externalTransactionId,
        );

      if (duplicateExternalId) {
        throw new DuplicateExternalTransactionError();
      }

      // 3. Find the original transaction when a reference is required.
      let reference: WagerTransaction | null = null;
      let pendingReference = false;

      if (
        input.kind === WagerTransactionKind.REFUND ||
        input.kind === WagerTransactionKind.ROLLBACK
      ) {
        if (!input.referenceExternalTransactionId) {
          throw new InvalidReferenceError(
            'Reference external transaction ID is required',
          );
        }

        reference = await transactionRepository.findByProviderAndExternalId(
          input.providerId,
          input.referenceExternalTransactionId,
        );

        if (
          !reference ||
          reference.status !== WagerTransactionStatus.PROCESSED
        ) {
          pendingReference = true;
        } else {
          if (input.kind === WagerTransactionKind.REFUND) {
            if (reference.kind !== WagerTransactionKind.BET) {
              throw new InvalidReferenceError(
                'REFUND must reference a BET transaction',
              );
            }
          } else if (
            reference.kind !== WagerTransactionKind.BET &&
            reference.kind !== WagerTransactionKind.WIN &&
            reference.kind !== WagerTransactionKind.REFUND
          ) {
            throw new InvalidReferenceError(
              'ROLLBACK must reference a BET, WIN or REFUND transaction',
            );
          }

          if (reference.playerId !== input.playerId) {
            throw new InvalidReferenceError(
              'Reference transaction player does not match',
            );
          }

          if (reference.roundId !== input.roundId) {
            throw new InvalidReferenceError(
              'Reference transaction round does not match',
            );
          }

          if (
            reference.money.currency !== input.money.currency ||
            !reference.money.equals(input.money)
          ) {
            throw new InvalidReferenceError(
              'Reference transaction amount does not match',
            );
          }
        }
      }

      // 4. Lock the wallet and validate its ID.
      const wallet =
        await walletRepository.findByPlayerIdAndCurrencyForUpdate(
          input.playerId,
          input.money.currency,
        );

      if (!wallet || wallet.id !== input.walletId) {
        throw new WalletNotFoundError();
      }

      // 5. Create the transaction.
      const transaction = WagerTransaction.create({
        ...input,
        id: randomUUID(),
      });

      // 6. Save transactions whose reference has not arrived yet.
      if (pendingReference) {
        transaction.markPendingReference();
        await transactionRepository.insert(transaction);

        return {
          transaction,
          balance: wallet.balance,
          idempotentReplay: false,
        };
      }

      // 7. LOSS does not change the wallet balance.
      if (input.kind === WagerTransactionKind.LOSS) {
        transaction.markProcessed(undefined, new Date());
        await transactionRepository.insert(transaction);

        return {
          transaction,
          balance: wallet.balance,
          idempotentReplay: false,
        };
      }

      // 8. Validate reference wallet and duplicate reversals.
      if (reference) {
        if (reference.walletId !== wallet.id) {
          throw new InvalidReferenceError(
            'Reference transaction belongs to another wallet',
          );
        }

        const existingReversal =
          await transactionRepository.findByReferenceTransactionId(
            reference.id,
          );

        if (existingReversal) {
          throw new DuplicateReversalError();
        }
      }

      // 9. Determine the ledger direction.
      const direction = transaction.ledgerDirectionFor(
        reference ?? undefined,
      );

      const balanceBefore = wallet.balance;

      // 10. Reject debits when the wallet has insufficient funds.
      if (
        direction === LedgerDirection.DEBIT &&
        balanceBefore.lessThan(input.money)
      ) {
        const isReversal =
          input.kind === WagerTransactionKind.REFUND ||
          input.kind === WagerTransactionKind.ROLLBACK;

        transaction.reject(
          isReversal
            ? 'REVERSAL_INSUFFICIENT_FUNDS'
            : 'INSUFFICIENT_FUNDS',
        );

        await transactionRepository.insert(transaction);

        return {
          transaction,
          balance: wallet.balance,
          idempotentReplay: false,
        };
      }

      // 11. Apply the financial operation.
      if (direction === LedgerDirection.DEBIT) {
        wallet.debit(input.money);
      } else if (direction === LedgerDirection.CREDIT) {
        wallet.credit(input.money);
      }

      // 12. Create the ledger entry.
      const ledgerEntry = WalletLedgerEntry.create({
        id: randomUUID(),
        walletId: wallet.id,
        transactionId: transaction.id,
        direction,
        money: input.money,
        balanceBefore,
      });

      // 13. Mark the transaction as processed.
      transaction.markProcessed(reference?.id, new Date());

      // 14. Persist the wallet, transaction and ledger atomically.
      await walletRepository.save(wallet);
      await transactionRepository.insert(transaction);
      await ledgerRepository.insert(ledgerEntry);

      return {
        transaction,
        balance: wallet.balance,
        idempotentReplay: false,
      };
    });
  }
}
