import { describe, expect, it } from 'vitest';
import { WalletLedgerEntry } from './wallet-ledger-entry.js';
import { LedgerDirection } from './wager-transaction.js';
import { Money } from '../value-objects/money.js';

const makeMoney = (amount: string, currency = 'BRL') =>
  Money.of(amount, currency as 'BRL' | 'USD' | 'EUR');

const makeEntry = (
  overrides: Partial<{
    id: string;
    walletId: string;
    transactionId: string;
    direction: LedgerDirection;
    money: Money;
    balanceBefore: Money;
  }> = {},
) =>
  WalletLedgerEntry.create({
    id: 'ledger-1',
    walletId: 'wallet-1',
    transactionId: 'transaction-1',
    direction: LedgerDirection.CREDIT,
    money: makeMoney('50.00'),
    balanceBefore: makeMoney('100.00'),
    ...overrides,
  });

describe('WalletLedgerEntry', () => {
  describe('create', () => {
    it('should create a credit ledger entry', () => {
      const entry = makeEntry();

      expect(entry).toBeInstanceOf(WalletLedgerEntry);
      expect(entry.id).toBe('ledger-1');
      expect(entry.walletId).toBe('wallet-1');
      expect(entry.transactionId).toBe('transaction-1');
      expect(entry.direction).toBe(LedgerDirection.CREDIT);
      expect(entry.money.equals(makeMoney('50.00'))).toBe(true);
      expect(entry.balanceBefore.equals(makeMoney('100.00'))).toBe(true);
      expect(entry.balanceAfter.equals(makeMoney('150.00'))).toBe(true);
      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('should calculate the balance after a debit', () => {
      const entry = makeEntry({
        direction: LedgerDirection.DEBIT,
        money: makeMoney('30.00'),
        balanceBefore: makeMoney('100.00'),
      });

      expect(entry.balanceAfter.equals(makeMoney('70.00'))).toBe(true);
    });

    it('should allow a debit that uses the entire balance', () => {
      const entry = makeEntry({
        direction: LedgerDirection.DEBIT,
        money: makeMoney('100.00'),
        balanceBefore: makeMoney('100.00'),
      });

      expect(entry.balanceAfter.equals(makeMoney('0.00'))).toBe(true);
    });

    it.each([
      ['id', { id: ' ' }],
      ['walletId', { walletId: ' ' }],
      ['transactionId', { transactionId: ' ' }],
    ])('should reject an empty %s', (_, override) => {
      expect(() => makeEntry(override)).toThrow();
    });

    it('should reject an invalid direction', () => {
      expect(() =>
        makeEntry({
          direction: 'INVALID' as LedgerDirection,
        }),
      ).toThrow('Invalid ledger entry direction');
    });

    it('should reject a zero money value', () => {
      expect(() =>
        makeEntry({
          money: makeMoney('0.00'),
        }),
      ).toThrow('Ledger entry amount must be positive');
    });

    it('should reject a debit greater than the available balance', () => {
      expect(() =>
        makeEntry({
          direction: LedgerDirection.DEBIT,
          money: makeMoney('150.00'),
          balanceBefore: makeMoney('100.00'),
        }),
      ).toThrow('Insufficient balance for ledger debit');
    });

    it('should reject a negative balance before', () => {
      expect(() =>
        makeEntry({
          balanceBefore: makeMoney('10.00').negate(),
        }),
      ).toThrow('Balance before cannot be negative');
    });

    it('should reject different currencies', () => {
      expect(() =>
        makeEntry({
          direction: LedgerDirection.CREDIT,
          money: makeMoney('50.00', 'USD'),
          balanceBefore: makeMoney('100.00', 'BRL'),
        }),
      ).toThrow();
    });
  });

  describe('rehydrate', () => {
    it('should reconstruct a valid ledger entry', () => {
      const createdAt = new Date('2026-11-02T12:00:00.000Z');

      const entry = WalletLedgerEntry.rehydrate({
        id: 'ledger-1',
        walletId: 'wallet-1',
        transactionId: 'transaction-1',
        direction: LedgerDirection.CREDIT,
        money: makeMoney('50.00'),
        balanceBefore: makeMoney('100.00'),
        balanceAfter: makeMoney('150.00'),
        createdAt,
      });

      expect(entry).toBeInstanceOf(WalletLedgerEntry);
      expect(entry.balanceAfter.equals(makeMoney('150.00'))).toBe(true);
      expect(entry.createdAt).toEqual(createdAt);
    });

    it('should reject an invalid creation date', () => {
      expect(() =>
        WalletLedgerEntry.rehydrate({
          id: 'ledger-1',
          walletId: 'wallet-1',
          transactionId: 'transaction-1',
          direction: LedgerDirection.CREDIT,
          money: makeMoney('50.00'),
          balanceBefore: makeMoney('100.00'),
          balanceAfter: makeMoney('150.00'),
          createdAt: new Date('invalid'),
        }),
      ).toThrow('Invalid ledger entry creation date');
    });

    it('should reject an inconsistent balance calculation', () => {
      expect(() =>
        WalletLedgerEntry.rehydrate({
          id: 'ledger-1',
          walletId: 'wallet-1',
          transactionId: 'transaction-1',
          direction: LedgerDirection.CREDIT,
          money: makeMoney('50.00'),
          balanceBefore: makeMoney('100.00'),
          balanceAfter: makeMoney('200.00'),
          createdAt: new Date(),
        }),
      ).toThrow('Invalid ledger entry balance calculation');
    });

    it('should reject an invalid direction', () => {
      expect(() =>
        WalletLedgerEntry.rehydrate({
          id: 'ledger-1',
          walletId: 'wallet-1',
          transactionId: 'transaction-1',
          direction: 'INVALID' as LedgerDirection,
          money: makeMoney('50.00'),
          balanceBefore: makeMoney('100.00'),
          balanceAfter: makeMoney('150.00'),
          createdAt: new Date(),
        }),
      ).toThrow('Invalid ledger entry direction');
    });
  });

  describe('isBalanced', () => {
    it('should return true for a valid credit entry', () => {
      const entry = makeEntry();

      expect(entry.isBalanced()).toBe(true);
    });

    it('should return true for a valid debit entry', () => {
      const entry = makeEntry({
        direction: LedgerDirection.DEBIT,
        money: makeMoney('30.00'),
        balanceBefore: makeMoney('100.00'),
      });

      expect(entry.isBalanced()).toBe(true);
    });

    it('should return false when the balance calculation is inconsistent', () => {
      // Simula um objeto inconsistente, como poderia ocorrer
      // caso os dados fossem alterados fora das factories.
      const entry = Object.assign(
        Object.create(WalletLedgerEntry.prototype),
        {
          direction: LedgerDirection.CREDIT,
          money: makeMoney('50.00'),
          balanceBefore: makeMoney('100.00'),
          balanceAfter: makeMoney('200.00'),
        },
      ) as WalletLedgerEntry;

      expect(entry.isBalanced()).toBe(false);
    });

    it('should return false when the balance calculation throws', () => {
      const entry = Object.assign(
        Object.create(WalletLedgerEntry.prototype),
        {
          direction: LedgerDirection.DEBIT,
          money: makeMoney('150.00'),
          balanceBefore: makeMoney('100.00'),
          balanceAfter: makeMoney('0.00'),
        },
      ) as WalletLedgerEntry;

      expect(entry.isBalanced()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should return a copy of the creation date', () => {
      const entry = makeEntry();
      const returnedDate = entry.createdAt;

      returnedDate.setFullYear(2000);

      expect(entry.createdAt.getFullYear()).not.toBe(2000);
    });
  });
});