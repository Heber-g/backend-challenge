import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import databaseConfig from './config/database.config.js';

@Module({
  imports: [
    MikroOrmModule.forRoot(databaseConfig), //Aqui coloquei a conexão com meu banco
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}