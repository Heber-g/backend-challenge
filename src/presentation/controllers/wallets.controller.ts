import { BadRequestException, Body, ConflictException, Controller, Post }
from '@nestjs/common';

import { Money } from '../../business-logic/value-objects/money.js';
import { OpenWalletService, WalletAlreadyExistsError }
from '../../application/services/open-wallet.service.js';

import { OpenWalletDto } from '../dtos/open-wallet.dto.js';

@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly openWalletService: OpenWalletService,
  ) {}

  @Post()
  async open(@Body() dto: OpenWalletDto) {
    let initialBalance: Money;

    try {
      initialBalance = Money.of(dto.initialBalance, dto.currency);
    } catch {
      throw new BadRequestException('Invalid initial balance');
    }

    try {
      const wallet = await this.openWalletService.execute({
        playerId: dto.playerId,
        initialBalance,
      });

      return {
        id: wallet.id,
        playerId: wallet.playerId,
        currency: wallet.currency,
        balance: wallet.balance.toString(),
        version: wallet.version,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      };
    } catch (error) {
      if (error instanceof WalletAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}