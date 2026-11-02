import { describe, expect, it } from 'vitest';
import {Wallet} from './wallet.js';
import { Money } from '../value-objects/money.js';

describe('Wallet', () => {
  it('should open a wallet with valid properties', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet1',
      playerId: 'player1',
      initialBalance: initialBalance,
    });

    expect(wallet.id).toBe('wallet1');
    expect(wallet.playerId).toBe('player1');
    expect(wallet.currency).toBe('BRL');
    expect(wallet.balance.toString()).toBe('100.00');
  });

  it('should throw an error when opening a wallet with negative initial balance', () => {
    const initialBalance = Money.of('100.00', 'BRL').negate();

    expect(() =>
      Wallet.open({
        id: 'wallet2',
        playerId: 'player2',
        initialBalance: initialBalance,
      })
    ).toThrow();
    });
    it('should throw an error when opening a wallet with empty player ID', () => {
    const initialBalance = Money.of('100.00', 'BRL');

    expect(() =>
      Wallet.open({
        id: 'wallet3',
        playerId: '',
        initialBalance: initialBalance,
      })
    ).toThrow();
    });
    it('should throw an error when opening a wallet with empty wallet ID', () => {
    const initialBalance = Money.of('100.00', 'BRL');

    expect(() =>
      Wallet.open({
        id: '',
        playerId: 'player3',
        initialBalance: initialBalance,
      })
    ).toThrow();
    });

    it('should rehydrate a wallet from state', () => {
    const state = {
      id: 'wallet4',
      playerId: 'player4',
      currency: 'BRL' as const,
      balance: Money.of('200.00', 'BRL'),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const wallet = Wallet.rehydrate(state);

    expect(wallet.id).toBe('wallet4');
    expect(wallet.playerId).toBe('player4');
    expect(wallet.currency).toBe('BRL');
    expect(wallet.balance.toString()).toBe('200.00');
    });

    it('should debit the wallet balance correctly', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet5',
      playerId: 'player5',
      initialBalance: initialBalance,
    });

    const debitAmount = Money.of('30.00', 'BRL');
    wallet.debit(debitAmount);
    expect(wallet.balance.toString()).toBe('70.00');
    });

    it('should throw an error when debiting more than the wallet balance', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet7',
      playerId: 'player7',
      initialBalance: initialBalance,
    });

    const debitAmount = Money.of('150.00', 'BRL');

    expect(() => wallet.debit(debitAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });
    
    it('should throw an error when debiting with a different currency', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet8',
      playerId: 'player8',
      initialBalance: initialBalance,
    });

    const debitAmount = Money.of('50.00', 'USD');

    expect(() => wallet.debit(debitAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });

    it('should throw an error when debiting with a negative amount', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet9',
      playerId: 'player9',
      initialBalance: initialBalance,
    });

    const debitAmount = Money.of('50.00', 'BRL').negate();

    expect(() => wallet.debit(debitAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });

    it('should throw an error when debiting with a zero amount', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet10',
      playerId: 'player10',
      initialBalance: initialBalance,
    });

    const debitAmount = Money.of('0.00', 'BRL');

    expect(() => wallet.debit(debitAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });

    it('should credit the wallet balance correctly', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet6',
      playerId: 'player6',
      initialBalance: initialBalance,
    });
    
    const creditAmount = Money.of('50.00', 'BRL');
    wallet.credit(creditAmount);
    expect(wallet.balance.toString()).toBe('150.00');
    });

    it('should throw an error when crediting with a different currency', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet11',
      playerId: 'player11',
      initialBalance: initialBalance,
    });

    const creditAmount = Money.of('50.00', 'USD');

    expect(() => wallet.credit(creditAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });

    it('should throw an error when crediting with a negative amount', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet12',
      playerId: 'player12',
      initialBalance: initialBalance,
    });

    const creditAmount = Money.of('50.00', 'BRL').negate();

    expect(() => wallet.credit(creditAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });
    
    it('should throw an error when crediting with a zero amount', () => {
    const initialBalance = Money.of('100.00', 'BRL');
    const wallet = Wallet.open({
      id: 'wallet13',
      playerId: 'player13',
      initialBalance: initialBalance,
    });

    const creditAmount = Money.of('0.00', 'BRL');

    expect(() => wallet.credit(creditAmount)).toThrow();
    expect(wallet.balance.toString()).toBe('100.00');
    expect(wallet.version).toBe(1);
    });

  });

  describe('Wallet - additional tests', () => {
  it('should start with version 1 when opening a wallet', () => {
    const wallet = Wallet.open({
      id: 'wallet14',
      playerId: 'player14',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    expect(wallet.version).toBe(1);
  });

  it('should initialize createdAt and updatedAt when opening a wallet', () => {
    const wallet = Wallet.open({
      id: 'wallet15',
      playerId: 'player15',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    expect(wallet.createdAt).toBeInstanceOf(Date);
    expect(wallet.updatedAt).toBeInstanceOf(Date);
    expect(wallet.createdAt.getTime()).toBe(wallet.updatedAt.getTime());
  });

  it('should preserve version when rehydrating a wallet', () => {
    const state = {
      id: 'wallet16',
      playerId: 'player16',
      currency: 'BRL' as const,
      balance: Money.of('200.00', 'BRL'),
      version: 5,
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-02T10:00:00Z'),
    };

    const wallet = Wallet.rehydrate(state);

    expect(wallet.version).toBe(5);
  });

  it('should preserve timestamps when rehydrating a wallet', () => {
    const createdAt = new Date('2026-01-01T10:00:00Z');
    const updatedAt = new Date('2026-01-02T10:00:00Z');

    const state = {
      id: 'wallet17',
      playerId: 'player17',
      currency: 'BRL' as const,
      balance: Money.of('200.00', 'BRL'),
      version: 3,
      createdAt,
      updatedAt,
    };

    const wallet = Wallet.rehydrate(state);

    expect(wallet.createdAt).toEqual(createdAt);
    expect(wallet.updatedAt).toEqual(updatedAt);
  });

  it('should increment version after a successful debit', () => {
    const wallet = Wallet.open({
      id: 'wallet18',
      playerId: 'player18',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    wallet.debit(Money.of('30.00', 'BRL'));

    expect(wallet.version).toBe(2);
  });

  it('should increment version after a successful credit', () => {
    const wallet = Wallet.open({
      id: 'wallet19',
      playerId: 'player19',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    wallet.credit(Money.of('30.00', 'BRL'));

    expect(wallet.version).toBe(2);
  });

  it('should increment version for each successful balance change', () => {
    const wallet = Wallet.open({
      id: 'wallet20',
      playerId: 'player20',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    wallet.debit(Money.of('20.00', 'BRL'));
    wallet.credit(Money.of('10.00', 'BRL'));
    wallet.debit(Money.of('5.00', 'BRL'));

    expect(wallet.balance.toString()).toBe('85.00');
    expect(wallet.version).toBe(4);
  });

  it('should allow debiting the exact wallet balance', () => {
    const wallet = Wallet.open({
      id: 'wallet21',
      playerId: 'player21',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    wallet.debit(Money.of('100.00', 'BRL'));

    expect(wallet.balance.toString()).toBe('0.00');
    expect(wallet.version).toBe(2);
  });

  it('should update updatedAt after a successful balance change', () => {
    const wallet = Wallet.open({
      id: 'wallet22',
      playerId: 'player22',
      initialBalance: Money.of('100.00', 'BRL'),
    });

    const previousUpdatedAt = wallet.updatedAt;

    wallet.credit(Money.of('50.00', 'BRL'));

    expect(wallet.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime(),
    );
  });
});