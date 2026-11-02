import { Decimal}  from 'decimal.js';
export type Currency = 'BRL' | 'USD' | 'EUR';

export class Money{
    private constructor(
        private readonly amount: Decimal, 
        public readonly currency: Currency
    ) {}
    
    static of(value: string, currency: Currency): Money {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      throw new Error('Invalid monetary amount');
    }

    const amount = new Decimal(value);

    if (!amount.isFinite() || amount.isNegative()) {
      throw new Error('Invalid monetary value. It must be a positive and finite number.');
    }

    return new Money(amount, currency);
  }

    add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Incompatible currency');
    }
    const result = this.amount.plus(other.amount);
    return new Money(result, this.currency);
    }

    subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Incompatible currency');
    }
    const result = this.amount.minus(other.amount);
    return new Money(result, this.currency);
  }

    negate(): Money {
    const result = this.amount.negated();
    return new Money(result, this.currency);
  }
  
    isZero(): boolean {
        const result = this.amount.isZero();
        return result;
  }

    toString(): string {
        return this.amount.toFixed(2);
    }

    isPositive(): boolean {
        return this.amount.greaterThan(0);
    }

    isNegative(): boolean {
        return this.amount.lessThan(0);
    }

    lessThan(other: Money): boolean {
        if (this.currency !== other.currency) {
            throw new Error('Incompatible currency');
        }
        const result = this.amount.lessThan(other.amount);
        return result;
    }

    equals(other: Money): boolean {
        return this.amount.equals(other.amount) && this.currency === other.currency;
    }

    toJSON(): { amount: string; currency: Currency } {
        return {
            amount: this.toString(),
            currency: this.currency,
        };
    }
}
