import { Migration } from '@mikro-orm/migrations';

export class Migration20261102044758 extends Migration {

  override name = 'Migration20261102044758';

  override up(): void | Promise<void> {
    this.addSql(`create table "database_check" ("id" serial primary key, "name" varchar(255) not null);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "database_check" cascade;`);
  }

}
