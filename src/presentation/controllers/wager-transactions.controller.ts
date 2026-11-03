
import { BadRequestException, Body, ConflictException, Controller, Headers, Post,
NotFoundException } from '@nestjs/common';

import { createHash } from 'node:crypto';

import { IdempotencyConflictError, ProcessWagerTransactionService,
DuplicateExternalTransactionError, InvalidReferenceError, DuplicateReversalError,
WalletNotFoundError, }
from '../../application/services/process-wager-transaction.service.js';

import { Money } from '../../business-logic/value-objects/money.js';
import { ProcessWagerTransactionDto } from '../dtos/process-wager-transaction.dto.js';

@Controller('wagering/transactions')
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
      walletId: dto.walletId,
      roundId: dto.roundId,
      gameId: dto.gameId,
      kind: dto.kind,
      referenceExternalTransactionId:
        dto.referenceExternalTransactionId ?? null,
      money: {
        amount: dto.money.amount,
        currency: dto.money.currency,
      },
    };

    const payloadHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    try {
      const result = await this.processWagerTransactionService.execute({
        providerId: dto.providerId,
        externalTransactionId: dto.externalTransactionId,
        playerId: dto.playerId,
        walletId: dto.walletId,
        roundId: dto.roundId,
        gameId: dto.gameId,
        kind: dto.kind,
        referenceExternalTransactionId:
          dto.referenceExternalTransactionId,
        idempotencyKey: idempotencyKey.trim(),
        payloadHash,
        money: Money.of(dto.money.amount, dto.money.currency),
      });

      return {
        transactionId: result.transaction.id,
        externalTransactionId: result.transaction.externalTransactionId,
        status: result.transaction.status,
        failureCode: result.transaction.failureCode,
        processedAt: result.transaction.processedAt,
        balance: {
          amount: result.balance.toString(),
          currency: result.balance.currency,
        },
        idempotentReplay: result.idempotentReplay,
      };
    } catch (error) {
      if (
        error instanceof IdempotencyConflictError ||
        error instanceof DuplicateExternalTransactionError ||
        error instanceof DuplicateReversalError
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof InvalidReferenceError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof WalletNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
