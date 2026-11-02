import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import databaseConfig from './config/database.config.js';
import { WagerModule } from './application/wager.module.js';

@Module({
  imports: [
    MikroOrmModule.forRoot(databaseConfig),
    WagerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}