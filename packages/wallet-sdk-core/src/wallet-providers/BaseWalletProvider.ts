import { shallowMerge } from '../utils/index.js';

/**
 * Common base for all wallet providers in this package.
 * Holds the `defaults` config and exposes `mergePolicy` for per-call option merging.
 *
 * Subclasses are responsible for:
 *   - declaring `chainType` literal
 *   - validating their own config variants
 *   - implementing the chain-specific provider interface
 */
export abstract class BaseWalletProvider<TDefaults extends object> {
  protected readonly defaults: TDefaults;

  constructor(defaults: TDefaults | undefined) {
    this.defaults = (defaults ?? {}) as TDefaults;
  }

  /**
   * Return the connected wallet address as a string. Subclasses may narrow the
   * return type to a chain-specific brand (e.g. `Address`, `IconEoaAddress`).
   */
  abstract getWalletAddress(): Promise<string>;

  /**
   * Merge per-call options over a slice of `defaults` keyed by `key`.
   * Use when defaults are grouped per-method (e.g. `defaults.sendTransaction`).
   */
  protected mergePolicy<K extends keyof TDefaults>(
    key: K,
    options?: TDefaults[K] extends infer V ? (V extends object ? V : never) : never,
  ): TDefaults[K] extends infer V ? (V extends object ? V : never) : never {
    return shallowMerge(
      this.defaults[key] as object | undefined,
      options as object | undefined,
    ) as TDefaults[K] extends infer V ? (V extends object ? V : never) : never;
  }

  /**
   * Merge per-call options over the entire `defaults` object.
   * Use when defaults are flat (single-level fields).
   */
  protected mergeDefaults(options?: Partial<TDefaults>): TDefaults {
    return shallowMerge(this.defaults, options as TDefaults);
  }
}
