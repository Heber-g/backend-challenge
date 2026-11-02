import { Migration } from '@mikro-orm/migrations';

export class Migration20261102201011 extends Migration {

  override name = 'Migration20261102201011';

  override up(): void | Promise<void> {
    this.addSql(`create table "wallet_ledger_entries" ("id" varchar(255) not null, "wallet_id" varchar(255) not null, "transaction_id" varchar(255) not null, "direction" text not null, "money_amount" numeric(18, 2) not null, "balance_before" numeric(18, 2) not null, "balance_after" numeric(18, 2) not null, "currency" varchar(3) not null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_transaction_id_unique" unique ("transaction_id");`);

    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_wallet_id_foreign" foreign key ("wallet_id") references "wallets" ("id");`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_transaction_id_foreign" foreign key ("transaction_id") references "wager_transactions" ("id");`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_check" check ("direction" in ('DEBIT', 'CREDIT'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "wallet_ledger_entries" cascade;`);
  }

}
