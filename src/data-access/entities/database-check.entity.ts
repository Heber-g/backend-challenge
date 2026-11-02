import {  Entity,  PrimaryKey,  Property,} from '@mikro-orm/decorators/legacy';

@Entity()
export class DatabaseCheck {
   @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}