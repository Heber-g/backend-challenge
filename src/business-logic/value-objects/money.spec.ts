
import { describe, expect, it } from 'vitest';
import { Money } from './money.js';

describe('Money', () => {
  it('should create a monetary value', () => {
    const money = Money.of('100.00', 'BRL');

    expect(money.currency).toBe('BRL');
  });

  it('should reject more than two decimal places', () => {
    expect(() => Money.of('100.999', 'BRL')).toThrow();
  });

  it('should reject negative values', () => {
    expect(() => Money.of('-100.00', 'BRL')).toThrow();
  });

  it('should reject scientific notation', () => {
    expect(() => Money.of('1e3', 'BRL')).toThrow();
  });

  //novos testes

  it('should add two monetary values of the same currency', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('50.00', 'BRL');
    const result = money1.add(money2);

    expect(result.currency).toBe('BRL');
    expect(result.toString()).toBe('150.00');
  });

  it('should throw an error when adding different currencies', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('50.00', 'USD');

    expect(() => money1.add(money2)).toThrow();
  });

  it('should subtract two monetary values of the same currency', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('50.00', 'BRL');
    const result = money1.subtract(money2);

    expect(result.currency).toBe('BRL');
    expect(result.toString()).toBe('50.00');
  });

  it('should throw an error when subtracting different currencies', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('50.00', 'USD');

    expect(() => money1.subtract(money2)).toThrow();
  });

  it('should negate a positive monetary value', () => {
    const money = Money.of('100.00', 'BRL');
    const negatedMoney = money.negate();

    expect(negatedMoney.currency).toBe('BRL');
    expect(negatedMoney.toString()).toBe('-100.00');
  });

  it('should negate a negative monetary value', () => {
    const money = Money.of('100.00', 'BRL');
    const negative = money.negate();
    const positiveAgain = negative.negate();

    expect(positiveAgain.currency).toBe('BRL');
    expect(positiveAgain.toString()).toBe('100.00');
  });

  it('should check if a monetary value is zero', () => {
    const zeroMoney = Money.of('0.00', 'BRL');
    const nonZeroMoney = Money.of('100.00', 'BRL');

    expect(zeroMoney.isZero()).toBe(true);
    expect(nonZeroMoney.isZero()).toBe(false);
  });

  it('should return a string representation of the monetary value', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('50.00', 'BRL');
    const result = money1.add(money2);

    expect(result.toString()).toBe('150.00');
  });

  it('should test imutable behavior', () => {
    const original = Money.of('100.00', 'BRL');
    const result = original.add(Money.of('50.00', 'BRL'));

    expect(original.toString()).toBe('100.00');
    expect(result.toString()).toBe('150.00');
  });

  it('should check if a monetary value is positive', () => {
    const  positiveMoney = Money.of('100.00', 'BRL').isPositive();
    const zeroMoney = Money.of('0.00', 'BRL').isPositive();

    const negativeMoney = Money.of('100.00', 'BRL').negate().isPositive();

    expect(positiveMoney).toBe(true);
    expect(zeroMoney).toBe(false);
    expect(negativeMoney).toBe(false);
  });

  it('should check if a monetary value is negative', () => {
    const  positiveMoney = Money.of('100.00', 'BRL').isNegative();
    const zeroMoney = Money.of('0.00', 'BRL').isNegative();

    const negativeMoney = Money.of('100.00', 'BRL').negate().isNegative();

    expect(positiveMoney).toBe(false);
    expect(zeroMoney).toBe(false);
    expect(negativeMoney).toBe(true);
  });

  it('should check if a monetary value is less than another', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('150.00', 'BRL');
    const money3 = Money.of('50.00', 'BRL');
    const money4 = Money.of('100.00', 'BRL');
    const money5 = Money.of('100.00', 'USD');


    expect(money1.lessThan(money2)).toBe(true);
    expect(money1.lessThan(money3)).toBe(false);
    expect(() => money1.lessThan(money5)).toThrow();
    expect(money1.lessThan(money4)).toBe(false);
  });
  
  it('should check if two monetary values are equal', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('100.00', 'BRL');
    const money3 = Money.of('150.00', 'BRL'); 

    expect(money1.equals(money2)).toBe(true);
    expect(money1.equals(money3)).toBe(false);
    });

  it('should check if two monetary values are equal with different currencies', () => {
    const money1 = Money.of('100.00', 'BRL');
    const money2 = Money.of('100.00', 'USD');

    expect(money1.equals(money2)).toBe(false);
  });

  it('should convert a monetary value to JSON', () => {
    const money = Money.of('100.00', 'BRL');
    const json = JSON.stringify(money);

    expect(json).toBe('{"amount":"100.00","currency":"BRL"}');
  });
  
});

