import { Check, Entity, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { DecimalType } from '@mikro-orm/core';

@Entity({ tableName: 'wallets' })
@Unique({ properties: ['playerId', 'currency'] })
@Check({ expression: '"balance" >= 0' })
export class WalletOrmEntity {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string', length: 255 })
  playerId!: string;
  
  @Property({ type: 'string', length: 3 })
  currency!: string;

  @Property({
  type: DecimalType,
  columnType: 'numeric(18, 2)',
  })
  balance!: string;
  
  @Property({ type: 'number', version: true })    
  version!: number;

  @Property({ type: 'Date', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({
    type: 'Date',
    columnType: 'timestamptz',
    onUpdate: () => new Date(),
    })
    updatedAt!: Date;
}