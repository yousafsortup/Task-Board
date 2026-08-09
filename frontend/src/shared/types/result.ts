/**
 * A tiny `Result` type so the domain layer can report failures without
 * throwing. Throwing is reserved for genuinely exceptional conditions;
 * expected failures (invalid input, missing record) travel as values.
 */
export type Result<TValue, TError = Error> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError };

export const ok = <TValue>(value: TValue): Result<TValue, never> => ({
  ok: true,
  value,
});

export const err = <TError>(error: TError): Result<never, TError> => ({
  ok: false,
  error,
});

export const isOk = <TValue, TError>(
  result: Result<TValue, TError>,
): result is { ok: true; value: TValue } => result.ok;

export const isErr = <TValue, TError>(
  result: Result<TValue, TError>,
): result is { ok: false; error: TError } => !result.ok;

/** Unwraps a result, falling back to `fallback` when it failed. */
export const unwrapOr = <TValue, TError>(
  result: Result<TValue, TError>,
  fallback: TValue,
): TValue => (result.ok ? result.value : fallback);
