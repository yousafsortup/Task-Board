/**
 * Domain-level errors. These are part of the business vocabulary, so they
 * live in the domain layer and never reference a transport or storage detail.
 */

export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERSISTENCE_ERROR';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  /** Field that failed validation, when the failure is attributable to one. */
  readonly field?: string;

  constructor(message: string, field?: string) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class TaskNotFoundError extends DomainError {
  constructor(id: string) {
    super('NOT_FOUND', `No task exists with id "${id}".`);
    this.name = 'TaskNotFoundError';
  }
}

export class PersistenceError extends DomainError {
  constructor(message: string, cause?: unknown) {
    super('PERSISTENCE_ERROR', message, { cause });
    this.name = 'PersistenceError';
  }
}

/** Normalises anything thrown into an `Error` we can render. */
export const toError = (thrown: unknown): Error =>
  thrown instanceof Error ? thrown : new Error(String(thrown));
