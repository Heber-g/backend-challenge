
import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
//Nesse arquivo eu centralizei as configurações do banco de dados, para simplifcicar
//a manutenção
export default defineConfig({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DB,
  metadataProvider: ReflectMetadataProvider,
  extensions: [Migrator],

  entities: ['./dist/data-access/entities/*.entity.js'],
  entitiesTs: ['./src/data-access/entities/*.entity.ts'],

  migrations: {
    path: './dist/data-access/migrations',
    pathTs: './src/data-access/migrations',
  },
});
