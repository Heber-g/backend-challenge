import { IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, 
ValidateNested, } from 'class-validator';

import { Type } from 'class-transformer';

import { WagerTransactionKind } from '../../business-logic/entities/wager-transaction.js';

class MoneyDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsIn(['BRL', 'USD', 'EUR'])
  currency!: 'BRL' | 'USD' | 'EUR';
}

export class ProcessWagerTransactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  providerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  externalTransactionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  playerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  walletId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  roundId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  gameId!: string;

  @IsEnum(WagerTransactionKind)
  kind!: WagerTransactionKind;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  referenceExternalTransactionId?: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  money!: MoneyDto;
}