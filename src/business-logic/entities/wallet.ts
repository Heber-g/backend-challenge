import { Money, type Currency } from '../value-objects/money.js';


export type WalletState = {
  id: string;
  playerId: string;
  currency: Currency;
  balance: Money;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly currency: Currency,
    private _balance: Money,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static open(props: {
    id: string;
    playerId: string;
    initialBalance: Money;
  }): Wallet {

    if(props.initialBalance.isNegative()) {
      throw new Error('Initial balance cannot be negative');
    }

    if(props.playerId.trim() === '') {
      throw new Error('Player ID cannot be empty');
    }
    
    if(props.id.trim() === '') {
      throw new Error('Wallet ID cannot be empty');
    }

    const date = new Date();
    return new Wallet(
      props.id,
      props.playerId,
      props.initialBalance.currency,
      props.initialBalance,
      1,
      date,
      date,
    );
  };

  /** Reconstrução a partir da persistência — não revalida transições. */
  static rehydrate(state: WalletState): Wallet {
    return new Wallet(
      state.id,
      state.playerId,
      state.currency,
      state.balance,
      state.version,
      state.createdAt,
      state.updatedAt,
    );

  };

  get balance(): Money { return this._balance; }
  get version(): number { return this._version; }
  get updatedAt(): Date { return this._updatedAt; }

  // Aplicam a movimentação mantendo saldo e ledger consistentes entre si.
  // Assinatura e retorno são decisão sua.
  debit(amount: Money): void {
  
    this.assertSameCurrency(amount);
    
    if(amount.isNegative() || amount.isZero()) {
        throw new Error('Debit amount cannot be negative or zero');
    }

    if (this._balance.lessThan(amount)) {
        throw new Error('Insufficient balance');
    }

    this._balance = this._balance.subtract(amount);
    this._version += 1;
    this._updatedAt = new Date();
  };

  credit(amount: Money): void {
    this.assertSameCurrency(amount);
    
    if(amount.isNegative() || amount.isZero()) {
      throw new Error('Credit amount cannot be negative or zero');
    }
    
    this._balance = this._balance.add(amount);
    this._version += 1;
    this._updatedAt = new Date();
  };

  private assertSameCurrency(money: Money): void{
    if (this.currency !== money.currency) {
      throw new Error('Incompatible currency');
    }
  };
}