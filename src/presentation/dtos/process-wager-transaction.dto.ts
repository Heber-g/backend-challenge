import { IsEnum, IsIn, IsString, Matches, MaxLength, MinLength } 
from 'class-validator';

import { WagerTransactionKind } from '../../business-logic/entities/wager-transaction.js';

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
  roundId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  gameId!: string;

  @IsEnum(WagerTransactionKind)
  kind!: WagerTransactionKind;

  // String para preservar a precisão monetária.
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsIn(['BRL', 'USD', 'EUR'])
  currency!: 'BRL' | 'USD' | 'EUR';
}