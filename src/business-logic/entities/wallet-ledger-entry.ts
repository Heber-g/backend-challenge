import { LedgerDirection } from './wager-transaction.js';
import { Money } from '../value-objects/money.js';

export type CreateWalletLedgerEntryProps = {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: Money;
  balanceBefore: Money;
};

export type WalletLedgerEntryState = CreateWalletLedgerEntryProps & {
  balanceAfter: Money;
  createdAt: Date;
};

export class WalletLedgerEntry {
  private constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly transactionId: string,
    public readonly direction: LedgerDirection,
    public readonly money: Money,
    public readonly balanceBefore: Money,
    public readonly balanceAfter: Money,
    private readonly _createdAt: Date,
  ) {}

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  static create(props: CreateWalletLedgerEntryProps): WalletLedgerEntry {
    this.validateIdentifiers(props);
    this.validateDirection(props.direction);
    this.validateAmount(props.money);

    const balanceAfter = this.calculateBalanceAfter(
      props.direction,
      props.money,
      props.balanceBefore,
    );

    return new WalletLedgerEntry(
      props.id,
      props.walletId,
      props.transactionId,
      props.direction,
      props.money,
      props.balanceBefore,
      balanceAfter,
      new Date(),
    );
  }

  static rehydrate(state: WalletLedgerEntryState): WalletLedgerEntry {
    this.validateIdentifiers(state);
    this.validateDirection(state.direction);
    this.validateAmount(state.money);

    if (!(state.createdAt instanceof Date) ||
        Number.isNaN(state.createdAt.getTime())) {
      throw new Error('Invalid ledger entry creation date');
    }

    const expectedBalanceAfter = this.calculateBalanceAfter(
      state.direction,
      state.money,
      state.balanceBefore,
    );

    if (!expectedBalanceAfter.equals(state.balanceAfter)) {
      throw new Error('Invalid ledger entry balance calculation');
    }

    return new WalletLedgerEntry(
      state.id,
      state.walletId,
      state.transactionId,
      state.direction,
      state.money,
      state.balanceBefore,
      state.balanceAfter,
      new Date(state.createdAt),
    );
  }

  private static validateIdentifiers(
    props: Pick<WalletLedgerEntryState, 'id' | 'walletId' | 'transactionId'>,
  ): void {
    if (!props.id.trim()) {
      throw new Error('Ledger entry ID cannot be empty');
    }

    if (!props.walletId.trim()) {
      throw new Error('Ledger entry wallet ID cannot be empty');
    }

    if (!props.transactionId.trim()) {
      throw new Error('Ledger entry transaction ID cannot be empty');
    }
  }

  private static validateDirection(direction: LedgerDirection): void {
    if (
      direction !== LedgerDirection.DEBIT &&
      direction !== LedgerDirection.CREDIT
    ) {
      throw new Error('Invalid ledger entry direction');
    }
  }

  private static validateAmount(amount: Money): void {
    if (!amount.isPositive()) {
      throw new Error('Ledger entry amount must be positive');
    }
  }

  private static calculateBalanceAfter(
    direction: LedgerDirection,
    money: Money,
    balanceBefore: Money,
  ): Money {
    if (balanceBefore.isNegative()) {
      throw new Error('Balance before cannot be negative');
    }

    if (direction === LedgerDirection.CREDIT) {
      return balanceBefore.add(money);
    }

    if (balanceBefore.lessThan(money)) {
      throw new Error('Insufficient balance for ledger debit');
    }

    return balanceBefore.subtract(money);
  }

  isBalanced(): boolean {
  try {
    const expectedBalanceAfter = WalletLedgerEntry.calculateBalanceAfter(
      this.direction,
      this.money,
      this.balanceBefore,
    );

    return expectedBalanceAfter.equals(this.balanceAfter);
  } catch {
    return false;
  }
}
}