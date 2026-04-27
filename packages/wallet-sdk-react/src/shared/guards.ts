// packages/wallet-sdk-react/src/shared/guards.ts

/**
 * Tiny runtime type guards used to safely narrow `unknown` values.
 *
 * Why this exists:
 * - In wallets land, many values come from outside TypeScript (window injections, 3rd-party SDKs, serialized state).
 * - Writing `as SomeType` skips checks and can crash later in confusing places.
 * - Guards + `assert(...)` let us fail fast with a clear error message at the boundary.
 */

export type UnknownRecord = Record<string, unknown>;

/** True if value is a non-null object (Record-like). */
export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

/** True if the object has a string property at `key`. */
export function hasStringProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is UnknownRecord & Record<Key, string> {
  return isRecord(value) && typeof value[key] === 'string';
}

/** True if the object has an optional string property at `key`. */
export function hasOptionalStringProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is UnknownRecord & Partial<Record<Key, string>> {
  return isRecord(value) && (value[key] === undefined || typeof value[key] === 'string');
}

/** True if the object has a boolean property at `key`. */
export function hasBooleanProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is UnknownRecord & Record<Key, boolean> {
  return isRecord(value) && typeof value[key] === 'boolean';
}

/** True if the object has a function property at `key`. */
export function hasFunctionProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is UnknownRecord & Record<Key, (...args: unknown[]) => unknown> {
  return isRecord(value) && typeof value[key] === 'function';
}

/**
 * Throws if condition is false.
 * Use this after guards to stop execution early with an actionable error message.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Validates the runtime shape of Sui provider dependencies before passing them to wallet-sdk-core.
 * Used by both SuiHydrator (render path) and SuiXService.createWalletProvider (imperative path).
 */
export function assertSuiProviderShape(caller: string, client: unknown, wallet: unknown, account: unknown): void {
  const clientOk =
    isRecord(client) &&
    hasFunctionProperty(client, 'executeTransactionBlock') &&
    hasFunctionProperty(client, 'devInspectTransactionBlock') &&
    hasFunctionProperty(client, 'getCoins');
  assert(clientOk, `[${caller}] invalid Sui client shape`);

  const walletOk = isRecord(wallet) && hasStringProperty(wallet, 'name');
  assert(walletOk, `[${caller}] invalid Sui wallet shape`);

  const accountOk = isRecord(account) && hasStringProperty(account, 'address');
  assert(accountOk, `[${caller}] invalid Sui account shape`);
}
