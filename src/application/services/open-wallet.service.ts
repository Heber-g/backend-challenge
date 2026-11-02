import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { Wallet } from '../../business-logic/entities/wallet.js';
import { Money, type Currency } from '../../business-logic/value-objects/money.js';
import { WalletRepository } from '../../data-access/repositories/wallet.repository.js';

export type OpenWalletInput = {
  playerId: string;
  initialBalance: Money;
};

export class WalletAlreadyExistsError extends Error {
  constructor() {
    super('A wallet already exists for this player and currency');
    this.name = 'WalletAlreadyExistsError';
  }
}

@Injectable()
export class OpenWalletService {
  constructor(
    private readonly em: EntityManager,
  ) {}

  async execute(input: OpenWalletInput): Promise<Wallet> {
    return this.em.transactional(async (txEm) => {
      const walletRepository = new WalletRepository(txEm);

      const existingWallet =
        await walletRepository.findByPlayerIdAndCurrency(
          input.playerId,
          input.initialBalance.currency,
        );

      if (existingWallet) {
        throw new WalletAlreadyExistsError();
      }

      const wallet = Wallet.open({
        id: randomUUID(),
        playerId: input.playerId,
        initialBalance: input.initialBalance,
      });

      await walletRepository.insert(wallet);

      return wallet;
    });
  }
}