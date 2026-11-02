import { DecimalType } from '@mikro-orm/core';
import { Check, Entity, PrimaryKey, Property, Unique, ManyToOne } 
from '@mikro-orm/decorators/legacy';

import { LedgerDirection } from '../../business-logic/entities/wager-transaction.js';

import { WalletOrmEntity } from './wallet.entity.js';
import { WagerTransactionOrmEntity } from './wager-transaction.entity.js';

@Entity({ tableName: 'wallet_ledger_entries' })
@Unique({ properties: ['transaction'] })
@Check({ expression: '"direction" in (\'DEBIT\', \'CREDIT\')' })
export class WalletLedgerEntryOrmEntity {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => WalletOrmEntity, { fieldName: 'wallet_id' })
  wallet!: WalletOrmEntity;

  @ManyToOne(() => WagerTransactionOrmEntity, {
    fieldName: 'transaction_id',
  })
  transaction!: WagerTransactionOrmEntity;

  @Property({ type: 'string', length: 10 })
  direction!: Exclude<LedgerDirection, LedgerDirection.NONE>;

  @Property({
    type: DecimalType,
    columnType: 'numeric(18, 2)',
  })
  moneyAmount!: string;

  @Property({
    type: DecimalType,
    columnType: 'numeric(18, 2)',
  })
  balanceBefore!: string;

  @Property({
    type: DecimalType,
    columnType: 'numeric(18, 2)',
  })
  balanceAfter!: string;

  @Property({ type: 'string', length: 3 })
  currency!: string;

  @Property({ type: 'Date', columnType: 'timestamptz' })
  createdAt!: Date;
}