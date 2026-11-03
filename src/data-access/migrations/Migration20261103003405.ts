import { Migration } from '@mikro-orm/migrations';

export class Migration20261103003405 extends Migration {

  override name = 'Migration20261103003405';

  override up(): void | Promise<void> {
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_reference_transaction_id_unique" unique ("reference_transaction_id");`);

    this.addSql(`alter table "wallet_ledger_entries" alter column "direction" type varchar(10) using ("direction"::varchar(10));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "wager_transactions" drop constraint "wager_transactions_reference_transaction_id_unique";`);

    this.addSql(`alter table "wallet_ledger_entries" alter column "direction" type text using ("direction"::text);`);
  }

}
