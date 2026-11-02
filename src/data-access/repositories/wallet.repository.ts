import { EntityManager } from '@mikro-orm/postgresql';

import { LockMode } from '@mikro-orm/core';

import { Wallet, type WalletState } from '../../business-logic/entities/wallet.js';

import { Money, type Currency, } from '../../business-logic/value-objects/money.js';

import { WalletOrmEntity } from '../entities/wallet.entity.js';

export class WalletRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Wallet | null> {
    const entity = await this.em.findOne(WalletOrmEntity, { id });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async findByPlayerIdAndCurrency(
    playerId: string,
    currency: Currency,
  ): Promise<Wallet | null> {
    const entity = await this.em.findOne(WalletOrmEntity, {
      playerId,
      currency,
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  private toDomain(entity: WalletOrmEntity): Wallet {
    const state: WalletState = {
      id: entity.id,
      playerId: entity.playerId,
      currency: entity.currency as Currency,
      balance: Money.of(entity.balance, entity.currency as Currency),
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    return Wallet.rehydrate(state);
  }

  async findByPlayerIdAndCurrencyForUpdate(
  playerId: string,
  currency: Currency, ): Promise<Wallet | null> {
  const entity = await this.em.findOne(
    WalletOrmEntity,
    {
      playerId,
      currency,
    },
    {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    },
  );

  return entity ? this.toDomain(entity) : null;
}

    async save(wallet: Wallet): Promise<void> {
  const entity = await this.em.findOne(WalletOrmEntity, {
    id: wallet.id,
  });

  if (!entity) {
    throw new Error(`Wallet ${wallet.id} was not found`);
  }

  entity.balance = wallet.balance.toString();
  entity.updatedAt = wallet.updatedAt;

  this.em.persist(entity);
}

async insert(wallet: Wallet): Promise<void> {
  const entity = new WalletOrmEntity();

  entity.id = wallet.id;
  entity.playerId = wallet.playerId;
  entity.currency = wallet.currency;
  entity.balance = wallet.balance.toString();
  entity.version = wallet.version;
  entity.createdAt = wallet.createdAt;
  entity.updatedAt = wallet.updatedAt;

  this.em.persist(entity);
}

}