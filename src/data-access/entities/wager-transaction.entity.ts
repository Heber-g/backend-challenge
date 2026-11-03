import { DecimalType } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, Enum, Unique, ManyToOne } 
from '@mikro-orm/decorators/legacy';

import { WagerTransactionKind, WagerTransactionStatus, type FailureCode, } 
from '../../business-logic/entities/wager-transaction.js';

import { WalletOrmEntity } from './wallet.entity.js';

@Entity({ tableName: 'wager_transactions' })
@Unique({
  properties: ['providerId', 'externalTransactionId'],
})
@Unique({
  properties: ['providerId', 'idempotencyKey'],
})
@Unique({
  properties: ['referenceTransactionId'],
})
export class WagerTransactionOrmEntity {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string', length: 255 })
  providerId!: string;

  @Property({ type: 'string', length: 255 })
  externalTransactionId!: string;

  @Property({ type: 'string', length: 255 })
  idempotencyKey!: string;

  @Property({ type: 'string', length: 64 })
  payloadHash!: string;

  @ManyToOne(() => WalletOrmEntity, { fieldName: 'wallet_id' })
  wallet!: WalletOrmEntity;

  @Property({ type: 'string', length: 255 })
  playerId!: string;

  @Property({ type: 'string', length: 255 })
  roundId!: string;

  @Property({ type: 'string', length: 255 })
  gameId!: string;

  @Enum({ items: () => WagerTransactionKind })
  kind!: WagerTransactionKind;

  @Property({
    type: DecimalType,
    columnType: 'numeric(18, 2)',
  })
  moneyAmount!: string;

  @Property({ type: 'string', length: 3 })
  currency!: string;

  @Property({ type: 'string', nullable: true })
  referenceExternalTransactionId?: string;

  @Enum({ items: () => WagerTransactionStatus })
  status!: WagerTransactionStatus;

  @Property({ type: 'string', nullable: true })
  referenceTransactionId?: string;

  @Property({ type: 'string', nullable: true })
  failureCode?: FailureCode;

  @Property({ type: 'Date' })
  createdAt!: Date;

  @Property({ type: 'Date', nullable: true })
  processedAt?: Date;
}