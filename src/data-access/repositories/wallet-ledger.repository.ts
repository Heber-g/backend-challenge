import { EntityManager } from '@mikro-orm/postgresql';

import { LedgerDirection } from '../../business-logic/entities/wager-transaction.js';

import { Money, type Currency } from '../../business-logic/value-objects/money.js';

import { WalletLedgerEntry, type WalletLedgerEntryState } 
from '../../business-logic/entities/wallet-ledger-entry.js';

import { WalletLedgerEntryOrmEntity } from '../entities/wallet-ledger-entry.entity.js';
import { WalletOrmEntity } from '../entities/wallet.entity.js';
import { WagerTransactionOrmEntity } from '../entities/wager-transaction.entity.js';

export class WalletLedgerRepository {
  constructor(private readonly em: EntityManager) {}

  async findByTransactionId(
    transactionId: string,
  ): Promise<WalletLedgerEntry | null> {
    const entity = await this.em.findOne(
      WalletLedgerEntryOrmEntity,
      {
        transaction: transactionId,
      },
    );

    return entity ? this.toDomain(entity) : null;
  }

  async findByWalletId(
    walletId: string,
  ): Promise<WalletLedgerEntry[]> {
    const entities = await this.em.find(
      WalletLedgerEntryOrmEntity,
      {
        wallet: walletId,
      },
      {
        orderBy: { createdAt: 'ASC' },
      },
    );

    return entities.map((entity) => this.toDomain(entity));
  }

  async insert(entry: WalletLedgerEntry): Promise<void> {
    const entity = new WalletLedgerEntryOrmEntity();

    entity.id = entry.id;

    entity.wallet = this.em.getReference(
      WalletOrmEntity,
      entry.walletId,
    );

    entity.transaction = this.em.getReference(
      WagerTransactionOrmEntity,
      entry.transactionId,
    );

    if (entry.direction === LedgerDirection.NONE) {
        throw new Error('A NONE direction cannot be registered in the ledger');
    }

    entity.direction = entry.direction;
    entity.moneyAmount = entry.money.toString();
    entity.balanceBefore = entry.balanceBefore.toString();
    entity.balanceAfter = entry.balanceAfter.toString();
    entity.currency = entry.money.currency;
    entity.createdAt = entry.createdAt;

    this.em.persist(entity);
  }

  private toDomain(
    entity: WalletLedgerEntryOrmEntity,
  ): WalletLedgerEntry {
    const currency = entity.currency as Currency;

    const state: WalletLedgerEntryState = {
      id: entity.id,
      walletId: entity.wallet.id,
      transactionId: entity.transaction.id,
      direction: entity.direction,
      money: Money.of(entity.moneyAmount, currency),
      balanceBefore: Money.of(entity.balanceBefore, currency),
      balanceAfter: Money.of(entity.balanceAfter, currency),
      createdAt: entity.createdAt,
    };

    return WalletLedgerEntry.rehydrate(state);
  }
}