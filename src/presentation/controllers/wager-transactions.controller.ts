
import { BadRequestException, Body, ConflictException, Controller, Headers, Post,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import { IdempotencyConflictError, ProcessWagerTransactionService } 
from '../../application/services/process-wager-transaction.service.js';

import { Money } from '../../business-logic/value-objects/money.js';
import { ProcessWagerTransactionDto } from '../dtos/process-wager-transaction.dto.js';

@Controller('wager-transactions')
export class WagerTransactionsController {
  constructor(
    private readonly processWagerTransactionService: ProcessWagerTransactionService,
  ) {}

  @Post()
  async process(
    @Body() dto: ProcessWagerTransactionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const payload = {
      providerId: dto.providerId,
      externalTransactionId: dto.externalTransactionId,
      playerId: dto.playerId,
      roundId: dto.roundId,
      gameId: dto.gameId,
      kind: dto.kind,
      amount: dto.amount,
      currency: dto.currency,
    };

    const payloadHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    try {
      const transaction = await this.processWagerTransactionService.execute({
        providerId: dto.providerId,
        externalTransactionId: dto.externalTransactionId,
        playerId: dto.playerId,
        roundId: dto.roundId,
        gameId: dto.gameId,
        kind: dto.kind,
        idempotencyKey,
        payloadHash,
        money: Money.of(dto.amount, dto.currency),
      });

      return {
        id: transaction.id,
        externalTransactionId: transaction.externalTransactionId,
        kind: transaction.kind,
        status: transaction.status,
        failureCode: transaction.failureCode,
        processedAt: transaction.processedAt,
      };
    } catch (error) {
      if (error instanceof IdempotencyConflictError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
