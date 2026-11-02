import { IsIn, IsString, Matches, MaxLength, MinLength }
from 'class-validator';

export class OpenWalletDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  playerId!: string;

  // Mantemos string para preservar a precisão monetária.
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  initialBalance!: string;

  @IsIn(['BRL', 'USD', 'EUR'])
  currency!: 'BRL' | 'USD' | 'EUR';
}