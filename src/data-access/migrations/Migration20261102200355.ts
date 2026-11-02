import { Migration } from '@mikro-orm/migrations';

export class Migration20261102200355 extends Migration {

  override name = 'Migration20261102200355';

  override up(): void | Promise<void> {
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_wallet_id_foreign" foreign key ("wallet_id") references "wallets" ("id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "wager_transactions" drop constraint "wager_transactions_wallet_id_foreign";`);
  }

}
