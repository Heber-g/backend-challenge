import { Module } from '@nestjs/common';
import { ProcessWagerTransactionService } from './services/process-wager-transaction.service.js';
import { WagerTransactionsController } from '../presentation/controllers/wager-transactions.controller.js';
import { OpenWalletService } from './services/open-wallet.service.js';
import { WalletsController } from '../presentation/controllers/wallets.controller.js';

@Module({
  providers: [ProcessWagerTransactionService, OpenWalletService],
  exports: [ProcessWagerTransactionService, OpenWalletService],
  controllers: [WagerTransactionsController, WalletsController],
})
export class WagerModule {}