import { Money } from '../value-objects/money.js';

export enum WagerTransactionKind {
  OPENING = 'OPENING',
  BET = 'BET',
  WIN = 'WIN',
  LOSS = 'LOSS',
  REFUND = 'REFUND',
  ROLLBACK = 'ROLLBACK',
}

export enum WagerTransactionStatus {
  PENDING = 'PENDING',
  PENDING_REFERENCE = 'PENDING_REFERENCE',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

export enum LedgerDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  NONE = 'NONE',
}

export type WagerTransactionState = {
  id: string;
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: WagerTransactionKind;
  money: Money;
  referenceExternalTransactionId?: string;
  createdAt: Date;
  status: WagerTransactionStatus;
  referenceTransactionId?: string;
  failureCode?: FailureCode;
  processedAt?: Date;
};

export type FailureCode =
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_REFERENCE'
  | 'DUPLICATE_REVERSAL'
  | 'CURRENCY_MISMATCH'
  | 'PLAYER_MISMATCH'
  | 'WALLET_MISMATCH'
  | 'REFERENCE_EXPIRED'
  | 'REVERSAL_INSUFFICIENT_FUNDS'
  | 'INTERNAL_ERROR';

export class InvalidTransactionStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransactionStateError';
  }
}
export type CreateWagerTransactionProps = {
  id: string;
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: WagerTransactionKind;
  money: Money;
  referenceExternalTransactionId?: string;
};

export class WagerTransaction {
  private constructor(
    public readonly id: string,
    public readonly providerId: string,
    public readonly externalTransactionId: string,
    public readonly idempotencyKey: string,
    public readonly payloadHash: string,
    public readonly walletId: string,
    public readonly playerId: string,
    public readonly roundId: string,
    public readonly gameId: string,
    public readonly kind: WagerTransactionKind,
    public readonly money: Money,
    /** id no provedor — não o id interno */
    public readonly referenceExternalTransactionId: string | undefined,
    public readonly createdAt: Date,
    private _status: WagerTransactionStatus,
    private _referenceTransactionId?: string,
    private _failureCode?: FailureCode,
    private _processedAt?: Date,
  ) {}

  /** Nasce em PENDING. Valida a exigência de referência por kind. */
  static create(props: CreateWagerTransactionProps): WagerTransaction {
    //Validating obrigatory properties:
    if (props.id.trim() === '') {
      throw new Error('Transaction ID cannot be empty');
    }
    if (props.providerId.trim() === '') {
      throw new Error('Provider ID cannot be empty');
    }
    if (props.externalTransactionId.trim() === '') {
      throw new Error('External Transaction ID cannot be empty');
    }
    if (props.idempotencyKey.trim() === '') {
      throw new Error('Idempotency Key cannot be empty');
    }
    if (props.payloadHash.trim() === '') {
      throw new Error('Payload Hash cannot be empty');
    }
    if (props.walletId.trim() === '') {
      throw new Error('Wallet ID cannot be empty');
    }
    if (props.playerId.trim() === '') {
      throw new Error('Player ID cannot be empty');
    }
    if (props.roundId.trim() === '') {
      throw new Error('Round ID cannot be empty');
    }
    if (props.gameId.trim() === '') {
      throw new Error('Game ID cannot be empty');
    }
    if (!props.money.isPositive()) {
      throw new Error('Money amount must be positive');
    }
    if ((props.kind === WagerTransactionKind.REFUND ||
        props.kind === WagerTransactionKind.ROLLBACK) &&
        (!props.referenceExternalTransactionId ||
        props.referenceExternalTransactionId.trim() === '')
    ) {
      throw new Error(
        'Reference External Transaction ID is required for REFUND and ROLLBACK transactions',
      );
    }

    //Creating instance of transaction:
    return new WagerTransaction(
      props.id,
      props.providerId,
      props.externalTransactionId,
      props.idempotencyKey,
      props.payloadHash,
      props.walletId,
      props.playerId,
      props.roundId,
      props.gameId,
      props.kind,
      props.money,
      props.referenceExternalTransactionId,
      new Date(),
      WagerTransactionStatus.PENDING,
    );
  }

  static rehydrate(state: WagerTransactionState): WagerTransaction {
    return new WagerTransaction(
      state.id,
      state.providerId,
      state.externalTransactionId,
      state.idempotencyKey,
      state.payloadHash,
      state.walletId,
      state.playerId,
      state.roundId,
      state.gameId,
      state.kind,
      state.money,
      state.referenceExternalTransactionId,
      state.createdAt,
      state.status,
      state.referenceTransactionId,
      state.failureCode,
      state.processedAt,
    );  
  }

  get status(): WagerTransactionStatus { return this._status; }
  get referenceTransactionId(): string | undefined { return this._referenceTransactionId; }
  get failureCode(): FailureCode | undefined { return this._failureCode; }
  get processedAt(): Date | undefined { return this._processedAt; }

  // ---- transições (lançam InvalidTransactionStateError se o estado atual for terminal)
  markProcessed( referenceTransactionId: string | undefined, at: Date): void {
  if (this.isTerminal()) {
    throw new InvalidTransactionStateError(
      'Cannot process a transaction in a terminal state',
    );
  }

  if (this.requiresReference() && !referenceTransactionId?.trim()) {
    throw new InvalidTransactionStateError(
      'Reference transaction ID is required',
    );
  }

  if (!(at instanceof Date) || Number.isNaN(at.getTime())) {
    throw new Error('Invalid processing date');
  }

  this._status = WagerTransactionStatus.PROCESSED;
  this._referenceTransactionId = referenceTransactionId;
  this._processedAt = at;
}

markPendingReference(): void {
  if (this.isTerminal()) {
    throw new InvalidTransactionStateError(
      'Cannot change a terminal transaction',
    );
  }

  if (!this.requiresReference()) {
    throw new InvalidTransactionStateError(
      'This transaction does not require a reference',
    );
  }

  if (this._status !== WagerTransactionStatus.PENDING) {
    throw new InvalidTransactionStateError(
      'Only pending transactions can become pending reference',
    );
  }

  this._status = WagerTransactionStatus.PENDING_REFERENCE;
}

reject(code: FailureCode): void {
  if (this.isTerminal()) {
    throw new InvalidTransactionStateError(
      'Cannot reject a transaction in a terminal state',
    );
  }

  this._status = WagerTransactionStatus.REJECTED;
  this._failureCode = code;
}

fail(code: FailureCode): void {
  if (this.isTerminal()) {
    throw new InvalidTransactionStateError(
      'Cannot fail a transaction in a terminal state',
    );
  }

  this._status = WagerTransactionStatus.FAILED;
  this._failureCode = code;
}

  // ---- consultas de domínio
  isTerminal(): boolean {
    return (
        this._status === WagerTransactionStatus.PROCESSED ||
        this._status === WagerTransactionStatus.REJECTED ||
        this._status === WagerTransactionStatus.FAILED
    );
  }

  affectsBalance(): boolean {
    return this.kind !== WagerTransactionKind.LOSS;
  };      // false para LOSS
  requiresReference(): boolean {
    return(
    this.kind === WagerTransactionKind.REFUND ||
    this.kind === WagerTransactionKind.ROLLBACK
    );
  }   // true para REFUND e ROLLBACK

  matchesPayload(payloadHash: string): boolean {
    return this.payloadHash === payloadHash;
  };

  ledgerDirectionFor(reference?: WagerTransaction): LedgerDirection {
  switch (this.kind) {
    case WagerTransactionKind.OPENING:
    case WagerTransactionKind.WIN:
      return LedgerDirection.CREDIT;

    case WagerTransactionKind.BET:
      return LedgerDirection.DEBIT;

    case WagerTransactionKind.LOSS:
      return LedgerDirection.NONE;

    case WagerTransactionKind.REFUND:
      if (!reference || reference.status !== WagerTransactionStatus.PROCESSED) {
        throw new InvalidTransactionStateError(
          'A processed reference transaction is required for REFUND',
        );
      }

      if (reference.kind !== WagerTransactionKind.BET) {
        throw new InvalidTransactionStateError(
          'REFUND must reference a BET transaction',
        );
      }

      return LedgerDirection.CREDIT;

    case WagerTransactionKind.ROLLBACK:
      if (!reference || reference.status !== WagerTransactionStatus.PROCESSED) {
        throw new InvalidTransactionStateError(
          'A processed reference transaction is required for ROLLBACK',
        );
      }

      switch (reference.kind) {
        case WagerTransactionKind.BET:
          return LedgerDirection.CREDIT;

        case WagerTransactionKind.WIN:
        case WagerTransactionKind.REFUND:
          return LedgerDirection.DEBIT;

        default:
          throw new InvalidTransactionStateError(
            'ROLLBACK can only reference a BET, WIN or REFUND transaction',
          );
      }
  }
}
}