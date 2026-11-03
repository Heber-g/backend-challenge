import { EntityManager } from '@mikro-orm/postgresql';

import { WagerTransaction, type WagerTransactionState } 
from '../../business-logic/entities/wager-transaction.js';

import { Money, type Currency } from '../../business-logic/value-objects/money.js';

import { WagerTransactionOrmEntity } from '../entities/wager-transaction.entity.js';
import { WalletOrmEntity } from '../entities/wallet.entity.js';

export class WagerTransactionRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<WagerTransaction | null> {
    const entity = await this.em.findOne(WagerTransactionOrmEntity, { id });

    return entity ? this.toDomain(entity) : null;
  }

  async findByProviderAndExternalId(
    providerId: string,
    externalTransactionId: string,
  ): Promise<WagerTransaction | null> {
    const entity = await this.em.findOne(WagerTransactionOrmEntity, {
      providerId,
      externalTransactionId,
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByIdempotencyKey(
    providerId: string,
    idempotencyKey: string,
  ): Promise<WagerTransaction | null> {
    const entity = await this.em.findOne(WagerTransactionOrmEntity, {
      providerId,
      idempotencyKey,
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByReferenceTransactionId(
  referenceTransactionId: string ): Promise<WagerTransaction | null> {
  const entity = await this.em.findOne(WagerTransactionOrmEntity, {
    referenceTransactionId,
  });

  return entity ? this.toDomain(entity) : null;
}

  async insert(transaction: WagerTransaction): Promise<void> {
    const entity = new WagerTransactionOrmEntity();

    this.applyState(entity, transaction);

    this.em.persist(entity);
  }

  async update(transaction: WagerTransaction): Promise<void> {
    const entity = await this.em.findOne(WagerTransactionOrmEntity, {
      id: transaction.id,
    });

    if (!entity) {
      throw new Error(
        `Transaction ${transaction.id} was not found`,
      );
    }

    this.applyState(entity, transaction);

    this.em.persist(entity);
  }

  private toDomain(
    entity: WagerTransactionOrmEntity,
  ): WagerTransaction {
    const currency = entity.currency as Currency;

    const state: WagerTransactionState = {
      id: entity.id,
      providerId: entity.providerId,
      externalTransactionId: entity.externalTransactionId,
      idempotencyKey: entity.idempotencyKey,
      payloadHash: entity.payloadHash,
      walletId: entity.wallet.id,
      playerId: entity.playerId,
      roundId: entity.roundId,
      gameId: entity.gameId,
      kind: entity.kind,
      money: Money.of(entity.moneyAmount, currency),
      referenceExternalTransactionId:
        entity.referenceExternalTransactionId ?? undefined,
      createdAt: entity.createdAt,
      status: entity.status,
      referenceTransactionId:
        entity.referenceTransactionId ?? undefined,
      failureCode: entity.failureCode,
      processedAt: entity.processedAt,
    };

    return WagerTransaction.rehydrate(state);
  }

  private applyState(
    entity: WagerTransactionOrmEntity,
    transaction: WagerTransaction,
  ): void {
    entity.id = transaction.id;
    entity.providerId = transaction.providerId;
    entity.externalTransactionId = transaction.externalTransactionId;
    entity.idempotencyKey = transaction.idempotencyKey;
    entity.payloadHash = transaction.payloadHash;

    entity.wallet = this.em.getReference(
      WalletOrmEntity,
      transaction.walletId,
    );

    entity.playerId = transaction.playerId;
    entity.roundId = transaction.roundId;
    entity.gameId = transaction.gameId;
    entity.kind = transaction.kind;
    entity.moneyAmount = transaction.money.toString();
    entity.currency = transaction.money.currency;
    entity.referenceExternalTransactionId =
      transaction.referenceExternalTransactionId;
    entity.status = transaction.status;
    entity.referenceTransactionId =
      transaction.referenceTransactionId;
    entity.failureCode = transaction.failureCode;
    entity.createdAt = transaction.createdAt;
    entity.processedAt = transaction.processedAt;
  }
}