
import { randomUUID, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { Wallet, } from '../../business-logic/entities/wallet.js';

import { WagerTransaction, WagerTransactionKind, LedgerDirection, }
from '../../business-logic/entities/wager-transaction.js';

import { WalletLedgerEntry } from '../../business-logic/entities/wallet-ledger-entry.js';
import { Money } from '../../business-logic/value-objects/money.js';

import { WalletRepository } from '../../data-access/repositories/wallet.repository.js';
import { WagerTransactionRepository } from '../../data-access/repositories/wager-transaction.repository.js';
import { WalletLedgerRepository } from '../../data-access/repositories/wallet-ledger.repository.js';

export type OpenWalletInput = {
  playerId: string;
  initialBalance: Money;
};

export class WalletAlreadyExistsError extends Error {
  constructor() {
    super('A wallet already exists for this player and currency');
    this.name = 'WalletAlreadyExistsError';
  }
}

@Injectable()
export class OpenWalletService {
  constructor(private readonly em: EntityManager) {}

  async execute(input: OpenWalletInput): Promise<Wallet> {
    return this.em.transactional(async (txEm) => {
      const walletRepository = new WalletRepository(txEm);
      const transactionRepository = new WagerTransactionRepository(txEm);
      const ledgerRepository = new WalletLedgerRepository(txEm);

      const existingWallet =
        await walletRepository.findByPlayerIdAndCurrency(
          input.playerId,
          input.initialBalance.currency,
        );

      if (existingWallet) {
        throw new WalletAlreadyExistsError();
      }

      const wallet = Wallet.open({
        id: randomUUID(),
        playerId: input.playerId,
        initialBalance: input.initialBalance,
      });

      await walletRepository.insert(wallet);

      // Saldo inicial zero não exige lançamento financeiro.
      if (input.initialBalance.isPositive()) {
        const transactionId = randomUUID();
        const now = new Date();

        const payloadHash = createHash('sha256')
          .update(`${wallet.id}:${input.initialBalance.toString()}`)
          .digest('hex');

        const openingTransaction = WagerTransaction.create({
          id: transactionId,
          providerId: 'INTERNAL',
          externalTransactionId: `OPENING:${wallet.id}`,
          idempotencyKey: `OPENING:${wallet.id}`,
          payloadHash,
          walletId: wallet.id,
          playerId: input.playerId,
          roundId: `OPENING:${wallet.id}`,
          gameId: 'INTERNAL',
          kind: WagerTransactionKind.OPENING,
          money: input.initialBalance,
        });

        openingTransaction.markProcessed(undefined, now);

        const ledgerEntry = WalletLedgerEntry.create({
          id: randomUUID(),
          walletId: wallet.id,
          transactionId,
          direction: LedgerDirection.CREDIT,
          money: input.initialBalance,
          balanceBefore: Money.of(
            '0',
            input.initialBalance.currency,
          ),
        });

        await transactionRepository.insert(openingTransaction);
        await ledgerRepository.insert(ledgerEntry);
      }

      return wallet;
    });
  }
}
