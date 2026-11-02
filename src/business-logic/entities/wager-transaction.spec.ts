import { WagerTransaction, WagerTransactionKind, WagerTransactionStatus, WagerTransactionState, 
InvalidTransactionStateError, LedgerDirection } from "./wager-transaction.js";

import { Money } from "../value-objects/money.js";
import { it, describe, expect } from "vitest";

describe("WagerTransaction", () => {
  it("should create a WagerTransaction with valid properties", () => {
    const money = Money.of("100.00", "BRL");
    const transaction = WagerTransaction.create({
      id: "transaction1",
      providerId: "provider1",
      externalTransactionId: "external1",
      idempotencyKey: "idempotency1",
      payloadHash: "hash1",
      walletId: "wallet1",
      playerId: "player1",
      roundId: "round1",
      gameId: "game1",
      kind: WagerTransactionKind.BET,
      money: money,
    });

    expect(transaction.id).toBe("transaction1");
    expect(transaction.providerId).toBe("provider1");
    expect(transaction.externalTransactionId).toBe("external1");
    expect(transaction.idempotencyKey).toBe("idempotency1");
    expect(transaction.payloadHash).toBe("hash1");
    expect(transaction.walletId).toBe("wallet1");
    expect(transaction.playerId).toBe("player1");
    expect(transaction.roundId).toBe("round1");
    expect(transaction.gameId).toBe("game1");
    expect(transaction.kind).toBe(WagerTransactionKind.BET);
    expect(transaction.money.toString()).toBe("100.00");
    expect(transaction.status).toBe(WagerTransactionStatus.PENDING);
  });

  it("should create a win WagerTransaction with valid properties", () => {
    const money = Money.of("50.00", "USD");
    const transaction = WagerTransaction.create({
      id: "transaction2",
      providerId: "provider2",
      externalTransactionId: "external2",
      idempotencyKey: "idempotency2",
      payloadHash: "hash2",
      walletId: "wallet2",
      playerId: "player2",
      roundId: "round2",
      gameId: "game2",
      kind: WagerTransactionKind.WIN,
      money: money,
    });

    expect(transaction.id).toBe("transaction2");
    expect(transaction.providerId).toBe("provider2");
    expect(transaction.externalTransactionId).toBe("external2");
    expect(transaction.idempotencyKey).toBe("idempotency2");
    expect(transaction.payloadHash).toBe("hash2");
    expect(transaction.walletId).toBe("wallet2");
    expect(transaction.playerId).toBe("player2");
    expect(transaction.roundId).toBe("round2");
    expect(transaction.gameId).toBe("game2");
    expect(transaction.kind).toBe(WagerTransactionKind.WIN);
    expect(transaction.money.toString()).toBe("50.00");
    expect(transaction.status).toBe(WagerTransactionStatus.PENDING);
  });

  it("shoul create a loss WagerTransaction with valid properties", () => {
    const money = Money.of("30.00", "EUR");
    const transaction = WagerTransaction.create({
      id: "transaction3",
      providerId: "provider3",
      externalTransactionId: "external3",
      idempotencyKey: "idempotency3",
      payloadHash: "hash3",
      walletId: "wallet3",
      playerId: "player3",
      roundId: "round3",
      gameId: "game3",
      kind: WagerTransactionKind.LOSS,
      money: money,
    });

    expect(transaction.id).toBe("transaction3");
    expect(transaction.providerId).toBe("provider3");
    expect(transaction.externalTransactionId).toBe("external3");
    expect(transaction.idempotencyKey).toBe("idempotency3");
    expect(transaction.payloadHash).toBe("hash3");
    expect(transaction.walletId).toBe("wallet3");
    expect(transaction.playerId).toBe("player3");
    expect(transaction.roundId).toBe("round3");
    expect(transaction.gameId).toBe("game3");
    expect(transaction.kind).toBe(WagerTransactionKind.LOSS);
    expect(transaction.money.toString()).toBe("30.00");
    expect(transaction.status).toBe(WagerTransactionStatus.PENDING);
  });

  it("should throw an error when creating a WagerTransaction with empty id", () => {
    const money = Money.of("100.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.BET,
        money: money,
      })
    ).toThrow();
  });

    it("should throw an error when creating a WagerTransaction with empty idempotencyKey", () => {
    const money = Money.of("100.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.BET,
        money: money,
      })
    ).toThrow();
  });

    it('should throw when creating a WagerTransaction with whitespace idempotencyKey', () => {
    expect(() =>
      WagerTransaction.create({
        id: 'transaction1',
        providerId: 'provider1',
        externalTransactionId: 'external1',
        idempotencyKey: '   ',
        payloadHash: 'hash1',
        walletId: 'wallet1',
        playerId: 'player1',
        roundId: 'round1',
        gameId: 'game1',
        kind: WagerTransactionKind.BET,
        money: Money.of('100.00', 'BRL'),
      }),
    ).toThrow();
  });

  it("should throw an error when creating a WagerTransaction with negative money amount", () => {
    const money = Money.of("100.00", "BRL").negate();

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.BET,
        money: money,
      })
    ).toThrow();
  });

  it("should throw an error when creating a REFUND WagerTransaction without referenceExternalTransactionId", () => {
    const money = Money.of("100.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.REFUND,
        money: money,
      })
    ).toThrow();
  });

  it("should throw an error when creating a ROLLBACK WagerTransaction without referenceExternalTransactionId", () => {
    const money = Money.of("100.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.ROLLBACK,
        money: money,
      })
    ).toThrow();
  });

  it("should create a REFUND WagerTransaction with referenceExternalTransactionId", () => {
    const money = Money.of("100.00", "BRL");
    const transaction = WagerTransaction.create({
      id: "transaction1",
      providerId: "provider1",
      externalTransactionId: "external1",
      idempotencyKey: "idempotency1",
      payloadHash: "hash1",
      walletId: "wallet1",
      playerId: "player1",
      roundId: "round1",
      gameId: "game1",
      kind: WagerTransactionKind.REFUND,
      money: money,
      referenceExternalTransactionId: "reference1",
    });

    expect(transaction.id).toBe("transaction1");
    expect(transaction.providerId).toBe("provider1");
    expect(transaction.externalTransactionId).toBe("external1");
    expect(transaction.idempotencyKey).toBe("idempotency1");
    expect(transaction.payloadHash).toBe("hash1");
    expect(transaction.walletId).toBe("wallet1");
    expect(transaction.playerId).toBe("player1");
    expect(transaction.roundId).toBe("round1");
    expect(transaction.gameId).toBe("game1");
    expect(transaction.kind).toBe(WagerTransactionKind.REFUND);
    expect(transaction.money.toString()).toBe("100.00");
    expect(transaction.status).toBe(WagerTransactionStatus.PENDING);
    expect(transaction.referenceExternalTransactionId).toBe("reference1");
  });

  it("should create a ROLLBACK WagerTransaction with referenceExternalTransactionId", () => {
    const money = Money.of("100.00", "BRL");
    const transaction = WagerTransaction.create({
      id: "transaction1",
      providerId: "provider1",
      externalTransactionId: "external1",
      idempotencyKey: "idempotency1",
      payloadHash: "hash1",
      walletId: "wallet1",
      playerId: "player1",
      roundId: "round1",
      gameId: "game1",
      kind: WagerTransactionKind.ROLLBACK,
      money: money,
      referenceExternalTransactionId: "reference1",
    }); 

    expect(transaction.id).toBe("transaction1");
    expect(transaction.providerId).toBe("provider1");
    expect(transaction.externalTransactionId).toBe("external1");
    expect(transaction.idempotencyKey).toBe("idempotency1");
    expect(transaction.payloadHash).toBe("hash1");
    expect(transaction.walletId).toBe("wallet1");
    expect(transaction.playerId).toBe("player1");
    expect(transaction.roundId).toBe("round1");
    expect(transaction.gameId).toBe("game1");
    expect(transaction.kind).toBe(WagerTransactionKind.ROLLBACK);
    expect(transaction.money.toString()).toBe("100.00");
    expect(transaction.status).toBe(WagerTransactionStatus.PENDING);
    expect(transaction.referenceExternalTransactionId).toBe("reference1");
  });

  it("should throw an error when creating a WagerTransaction with empty providerId", () => {
    const money = Money.of("100.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.BET,
        money: money,
      })
    ).toThrow();
  });

  it("should throw an error when creating a WagerTransaction with balance 0", () => {
    const money = Money.of("0.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "hash1",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.BET,
        money: money,
      })
    ).toThrow();
  });

  it("should throw an error when creating a WagerTransaction with empty payload hash", () => {
    const money = Money.of("100.00", "BRL");

    expect(() =>
      WagerTransaction.create({
        id: "transaction1",
        providerId: "provider1",
        externalTransactionId: "external1",
        idempotencyKey: "idempotency1",
        payloadHash: "",
        walletId: "wallet1",
        playerId: "player1",
        roundId: "round1",
        gameId: "game1",
        kind: WagerTransactionKind.BET,
        money: money,
      })
    ).toThrow();
  });
});

describe('WagerTransaction rehydrate', () => {
  const createdAt = new Date('2026-11-01T10:00:00.000Z');
  const processedAt = new Date('2026-11-01T10:05:00.000Z');

  const makeState = (
    overrides: Partial<WagerTransactionState> = {},
  ): WagerTransactionState => ({
    id: 'transaction-1',
    providerId: 'provider-1',
    externalTransactionId: 'external-1',
    idempotencyKey: 'idempotency-1',
    payloadHash: 'hash-123',
    walletId: 'wallet-1',
    playerId: 'player-1',
    roundId: 'round-1',
    gameId: 'game-1',
    kind: WagerTransactionKind.BET,
    money: Money.of('50.00', 'BRL'),
    createdAt,
    status: WagerTransactionStatus.PENDING,
    ...overrides,
  });

  it('should restore a pending transaction', () => {
    const state = makeState();

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.id).toBe(state.id);
    expect(transaction.providerId).toBe(state.providerId);
    expect(transaction.externalTransactionId).toBe(
      state.externalTransactionId,
    );
    expect(transaction.idempotencyKey).toBe(state.idempotencyKey);
    expect(transaction.payloadHash).toBe(state.payloadHash);
    expect(transaction.walletId).toBe(state.walletId);
    expect(transaction.playerId).toBe(state.playerId);
    expect(transaction.roundId).toBe(state.roundId);
    expect(transaction.gameId).toBe(state.gameId);
    expect(transaction.kind).toBe(state.kind);
    expect(transaction.money).toBe(state.money);
    expect(transaction.createdAt).toBe(createdAt);
    expect(transaction.status).toBe(WagerTransactionStatus.PENDING);
  });

  it('should restore a processed transaction with optional fields', () => {
    const state = makeState({
      status: WagerTransactionStatus.PROCESSED,
      referenceExternalTransactionId: 'external-reference-1',
      referenceTransactionId: 'transaction-reference-1',
      processedAt,
    });

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.status).toBe(WagerTransactionStatus.PROCESSED);
    expect(transaction.referenceExternalTransactionId).toBe(
      'external-reference-1',
    );
    expect(transaction.referenceTransactionId).toBe(
      'transaction-reference-1',
    );
    expect(transaction.processedAt).toBe(processedAt);
    expect(transaction.isTerminal()).toBe(true);
  });

  it('should restore a rejected transaction with its failure code', () => {
    const failureCode = 'INSUFFICIENT_FUNDS' as never;

    const state = makeState({
      status: WagerTransactionStatus.REJECTED,
      failureCode,
    });

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.status).toBe(WagerTransactionStatus.REJECTED);
    expect(transaction.failureCode).toBe(failureCode);
    expect(transaction.isTerminal()).toBe(true);
  });

  it('should restore a failed transaction with its failure code', () => {
    const failureCode = 'INTERNAL_ERROR' as never;

    const state = makeState({
      status: WagerTransactionStatus.FAILED,
      failureCode,
    });

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.status).toBe(WagerTransactionStatus.FAILED);
    expect(transaction.failureCode).toBe(failureCode);
    expect(transaction.isTerminal()).toBe(true);
  });

  it('should restore a transaction pending reference', () => {
    const state = makeState({
      kind: WagerTransactionKind.REFUND,
      referenceExternalTransactionId: 'external-reference-1',
      status: WagerTransactionStatus.PENDING_REFERENCE,
    });

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.status).toBe(
      WagerTransactionStatus.PENDING_REFERENCE,
    );
    expect(transaction.referenceExternalTransactionId).toBe(
      'external-reference-1',
    );
    expect(transaction.isTerminal()).toBe(false);
  });

  it('should preserve undefined optional fields', () => {
    const state = makeState();

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.referenceExternalTransactionId).toBeUndefined();
    expect(transaction.referenceTransactionId).toBeUndefined();
    expect(transaction.failureCode).toBeUndefined();
    expect(transaction.processedAt).toBeUndefined();
  });

  it('should not change the original createdAt date', () => {
    const state = makeState();

    const transaction = WagerTransaction.rehydrate(state);

    expect(transaction.createdAt).toBe(createdAt);
    expect(transaction.createdAt.getTime()).toBe(
      new Date('2026-11-01T10:00:00.000Z').getTime(),
    );
  });
});

describe('WagerTransaction state transitions', () => {
  const makeTransaction = (
    kind: WagerTransactionKind = WagerTransactionKind.BET,
    referenceExternalTransactionId?: string,
  ) => {
    return WagerTransaction.create({
      id: 'transaction-1',
      providerId: 'provider-1',
      externalTransactionId: 'external-1',
      idempotencyKey: 'idempotency-1',
      payloadHash: 'hash-123',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind,
      money: Money.of('50.00', 'BRL'),
      referenceExternalTransactionId,
    });
  };

  describe('markProcessed', () => {
    it('should mark a pending transaction as processed', () => {
      const transaction = makeTransaction();
      const processedAt = new Date();

      transaction.markProcessed(undefined, processedAt);

      expect(transaction.status).toBe(WagerTransactionStatus.PROCESSED);
      expect(transaction.processedAt).toBe(processedAt);
      expect(transaction.isTerminal()).toBe(true);
    });

    it('should store the internal reference transaction ID', () => {
      const transaction = makeTransaction(
        WagerTransactionKind.REFUND,
        'external-reference-1',
      );
      const processedAt = new Date();

      transaction.markProcessed('internal-reference-1', processedAt);

      expect(transaction.status).toBe(WagerTransactionStatus.PROCESSED);
      expect(transaction.referenceTransactionId).toBe(
        'internal-reference-1',
      );
    });

    it('should throw when processing a REFUND without reference ID', () => {
      const transaction = makeTransaction(
        WagerTransactionKind.REFUND,
        'external-reference-1',
      );

      expect(() => transaction.markProcessed(undefined, new Date())).toThrow(
        InvalidTransactionStateError,
      );
    });

    it('should throw when processing with an invalid date', () => {
      const transaction = makeTransaction();
      const invalidDate = new Date('invalid');

      expect(() =>
        transaction.markProcessed(undefined, invalidDate),
      ).toThrow('Invalid processing date');
    });

    it('should throw when processing an already processed transaction', () => {
      const transaction = makeTransaction();

      transaction.markProcessed(undefined, new Date());

      expect(() =>
        transaction.markProcessed(undefined, new Date()),
      ).toThrow(InvalidTransactionStateError);
    });
  });

  describe('markPendingReference', () => {
    it('should mark a REFUND transaction as pending reference', () => {
      const transaction = makeTransaction(
        WagerTransactionKind.REFUND,
        'external-reference-1',
      );

      transaction.markPendingReference();

      expect(transaction.status).toBe(
        WagerTransactionStatus.PENDING_REFERENCE,
      );
      expect(transaction.isTerminal()).toBe(false);
    });

    it('should mark a ROLLBACK transaction as pending reference', () => {
      const transaction = makeTransaction(
        WagerTransactionKind.ROLLBACK,
        'external-reference-1',
      );

      transaction.markPendingReference();

      expect(transaction.status).toBe(
        WagerTransactionStatus.PENDING_REFERENCE,
      );
    });

    it('should throw when transaction does not require a reference', () => {
      const transaction = makeTransaction(WagerTransactionKind.BET);

      expect(() => transaction.markPendingReference()).toThrow(
        InvalidTransactionStateError,
      );
    });

    it('should throw when transaction is already pending reference', () => {
      const transaction = makeTransaction(
        WagerTransactionKind.REFUND,
        'external-reference-1',
      );

      transaction.markPendingReference();

      expect(() => transaction.markPendingReference()).toThrow(
        InvalidTransactionStateError,
      );
    });
  });

  describe('reject', () => {
    it('should reject a pending transaction with a failure code', () => {
      const transaction = makeTransaction();

      transaction.reject('INSUFFICIENT_FUNDS');

      expect(transaction.status).toBe(WagerTransactionStatus.REJECTED);
      expect(transaction.failureCode).toBe('INSUFFICIENT_FUNDS');
      expect(transaction.isTerminal()).toBe(true);
    });

    it('should reject a transaction pending reference', () => {
      const transaction = makeTransaction(
        WagerTransactionKind.REFUND,
        'external-reference-1',
      );

      transaction.markPendingReference();
      transaction.reject('INVALID_REFERENCE');

      expect(transaction.status).toBe(WagerTransactionStatus.REJECTED);
      expect(transaction.failureCode).toBe('INVALID_REFERENCE');
    });

    it('should throw when rejecting an already rejected transaction', () => {
      const transaction = makeTransaction();

      transaction.reject('INSUFFICIENT_FUNDS');

      expect(() => transaction.reject('INTERNAL_ERROR')).toThrow(
        InvalidTransactionStateError,
      );
    });
  });

  describe('fail', () => {
    it('should mark a pending transaction as failed', () => {
      const transaction = makeTransaction();

      transaction.fail('INTERNAL_ERROR');

      expect(transaction.status).toBe(WagerTransactionStatus.FAILED);
      expect(transaction.failureCode).toBe('INTERNAL_ERROR');
      expect(transaction.isTerminal()).toBe(true);
    });

    it('should throw when failing an already failed transaction', () => {
      const transaction = makeTransaction();

      transaction.fail('INTERNAL_ERROR');

      expect(() => transaction.fail('INTERNAL_ERROR')).toThrow(
        InvalidTransactionStateError,
      );
    });
  });

  describe('terminal states', () => {
    it('should not allow rejecting a processed transaction', () => {
      const transaction = makeTransaction();

      transaction.markProcessed(undefined, new Date());

      expect(() => transaction.reject('INTERNAL_ERROR')).toThrow(
        InvalidTransactionStateError,
      );
    });

    it('should not allow failing a rejected transaction', () => {
      const transaction = makeTransaction();

      transaction.reject('INSUFFICIENT_FUNDS');

      expect(() => transaction.fail('INTERNAL_ERROR')).toThrow(
        InvalidTransactionStateError,
      );
    });
  });
});

describe('ledgerDirectionFor', () => {
  const makeTransaction = (
    kind: WagerTransactionKind,
    referenceExternalTransactionId?: string,
  ) =>
    WagerTransaction.create({
      id: crypto.randomUUID(),
      providerId: 'provider-1',
      externalTransactionId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      payloadHash: 'hash-123',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind,
      money: Money.of('50.00', 'BRL'),
      referenceExternalTransactionId,
    });

  const makeProcessedReference = (kind: WagerTransactionKind) => {
  const reference = makeTransaction(
    kind,
    kind === WagerTransactionKind.REFUND ||
    kind === WagerTransactionKind.ROLLBACK
      ? 'external-reference'
      : undefined,
  );

  reference.markProcessed(
    kind === WagerTransactionKind.REFUND ||
    kind === WagerTransactionKind.ROLLBACK
      ? 'internal-reference'
      : undefined,
    new Date(),
  );

  return reference;
};

  it('should return CREDIT for OPENING', () => {
    expect(
      makeTransaction(WagerTransactionKind.OPENING).ledgerDirectionFor(),
    ).toBe(LedgerDirection.CREDIT);
  });

  it('should return DEBIT for BET', () => {
    expect(
      makeTransaction(WagerTransactionKind.BET).ledgerDirectionFor(),
    ).toBe(LedgerDirection.DEBIT);
  });

  it('should return CREDIT for WIN', () => {
    expect(
      makeTransaction(WagerTransactionKind.WIN).ledgerDirectionFor(),
    ).toBe(LedgerDirection.CREDIT);
  });

  it('should return NONE for LOSS', () => {
    expect(
      makeTransaction(WagerTransactionKind.LOSS).ledgerDirectionFor(),
    ).toBe(LedgerDirection.NONE);
  });

  it('should return CREDIT for REFUND referencing a processed BET', () => {
    const refund = makeTransaction(
      WagerTransactionKind.REFUND,
      'external-reference',
    );

    expect(
      refund.ledgerDirectionFor(
        makeProcessedReference(WagerTransactionKind.BET),
      ),
    ).toBe(LedgerDirection.CREDIT);
  });

  it('should return CREDIT for ROLLBACK referencing a processed BET', () => {
    const rollback = makeTransaction(
      WagerTransactionKind.ROLLBACK,
      'external-reference',
    );

    expect(
      rollback.ledgerDirectionFor(
        makeProcessedReference(WagerTransactionKind.BET),
      ),
    ).toBe(LedgerDirection.CREDIT);
  });

  it('should return DEBIT for ROLLBACK referencing a processed WIN', () => {
    const rollback = makeTransaction(
      WagerTransactionKind.ROLLBACK,
      'external-reference',
    );

    expect(
      rollback.ledgerDirectionFor(
        makeProcessedReference(WagerTransactionKind.WIN),
      ),
    ).toBe(LedgerDirection.DEBIT);
  });

  it('should return DEBIT for ROLLBACK referencing a processed REFUND', () => {
    const rollback = makeTransaction(
      WagerTransactionKind.ROLLBACK,
      'external-reference',
    );

    expect(
      rollback.ledgerDirectionFor(
        makeProcessedReference(WagerTransactionKind.REFUND),
      ),
    ).toBe(LedgerDirection.DEBIT);
  });

  it('should throw when REFUND has no reference', () => {
    const refund = makeTransaction(
      WagerTransactionKind.REFUND,
      'external-reference',
    );

    expect(() => refund.ledgerDirectionFor()).toThrow(
      InvalidTransactionStateError,
    );
  });

  it('should throw when REFUND references a WIN', () => {
    const refund = makeTransaction(
      WagerTransactionKind.REFUND,
      'external-reference',
    );

    expect(() =>
      refund.ledgerDirectionFor(
        makeProcessedReference(WagerTransactionKind.WIN),
      ),
    ).toThrow(InvalidTransactionStateError);
  });

  it('should throw when ROLLBACK references a LOSS', () => {
    const rollback = makeTransaction(
      WagerTransactionKind.ROLLBACK,
      'external-reference',
    );

    expect(() =>
      rollback.ledgerDirectionFor(
        makeProcessedReference(WagerTransactionKind.LOSS),
      ),
    ).toThrow(InvalidTransactionStateError);
  });

  it('should throw when reference transaction is not processed', () => {
    const refund = makeTransaction(
      WagerTransactionKind.REFUND,
      'external-reference',
    );

    const pendingReference = makeTransaction(WagerTransactionKind.BET);

    expect(() => refund.ledgerDirectionFor(pendingReference)).toThrow(
      InvalidTransactionStateError,
    );
  });
});