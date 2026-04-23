import type { Address } from '../shared/shared.js';
import type { Prettify } from '../common/common.js';

export type BigintIsh = bigint | number | string;
export declare enum TradeType {
  EXACT_INPUT = 0,
  EXACT_OUTPUT = 1,
}
export declare enum Rounding {
  ROUND_DOWN = 0,
  ROUND_HALF_UP = 1,
  ROUND_UP = 2,
}
export declare const MINIMUM_LIQUIDITY = 1000n;
export declare const ZERO = 0n;
export declare const ONE = 1n;
export declare const TWO = 2n;
export declare const THREE = 3n;
export declare const FIVE = 5n;
export declare const TEN = 10n;
export declare const _100 = 100n;
export declare const _9975 = 9975n;
export declare const _10000 = 10000n;
export declare const MaxUint256: bigint;
export declare enum VMType {
  uint8 = 'uint8',
  uint256 = 'uint256',
}
export declare const VM_TYPE_MAXIMA: {
  uint8: bigint;
  uint256: bigint;
};
export declare const ZERO_ADDRESS: '0x0000000000000000000000000000000000000000';

/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
// biome-ignore lint/suspicious/noExplicitAny: importing from @pancakeswap/swap-sdk-core
export declare abstract class BaseCurrency<T extends BaseCurrency<any> = BaseCurrency<any>> {
  /**
   * Returns whether the currency is native to the chain and must be wrapped (e.g. Ether)
   */
  abstract readonly isNative: boolean;
  /**
   * Returns whether the currency is a token that is usable in PancakeSwap without wrapping
   */
  abstract readonly isToken: boolean;
  /**
   * The chain ID on which this currency resides
   */
  readonly chainId: number;
  /**
   * The decimals used in representing currency amounts
   */
  readonly decimals: number;
  /**
   * The symbol of the currency, i.e. a short textual non-unique identifier
   */
  readonly symbol: string;
  /**
   * The name of the currency, i.e. a descriptive textual non-unique identifier
   */
  readonly name?: string;
  /**
   * Constructs an instance of the base class `BaseCurrency`.
   * @param chainId the chain ID on which this currency resides
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(chainId: number, decimals: number, symbol: string, name?: string);
  /**
   * Returns whether this currency is functionally equivalent to the other currency
   * @param other the other currency
   */
  abstract equals(other: BaseCurrency<T>): boolean;
  /**
   * Return the wrapped version of this currency that can be used with the PancakeSwap contracts. Currencies must
   * implement this to be used in PancakeSwap
   */
  abstract get wrapped(): T;
  get asToken(): T;
}

export interface SerializedToken {
  chainId: number;
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  name?: string;
  projectLink?: string;
}
/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export declare class Token extends BaseCurrency<Token> {
  readonly isNative: false;
  readonly isToken: true;
  /**
   * The contract address on the chain on which this token lives
   */
  readonly address: `0x${string}`;
  readonly projectLink?: string;
  constructor(
    chainId: number,
    address: `0x${string}`,
    decimals: number,
    symbol: string,
    name?: string,
    projectLink?: string,
  );
  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  equals(other: BaseCurrency): boolean;
  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  sortsBefore(other: Token): boolean;
  /**
   * Return this token, which does not need to be wrapped
   */
  get wrapped(): Token;
  get serialize(): SerializedToken;
}

/**
 * Represents the native currency of the chain on which it resides, e.g.
 */
export declare abstract class NativeCurrency extends BaseCurrency<Token> {
  readonly isNative: true;
  readonly isToken: false;
  get asToken(): Token;
}

export interface SerializedSPLToken {
  chainId: number;
  address: string;
  programId: string;
  decimals: number;
  symbol: string;
  name?: string;
  projectLink?: string;
}
/**
 * Represents an SPL token on Solana or other non-EVM chains.
 */
export declare class SPLToken extends BaseCurrency<SPLToken> {
  readonly isNative: false;
  readonly isToken: true;
  readonly address: string;
  readonly programId: string;
  readonly logoURI: string;
  readonly projectLink?: string;
  static isSPLToken(token?: UnifiedCurrency): boolean;
  constructor({
    chainId,
    programId,
    address,
    decimals,
    symbol,
    logoURI,
    name,
    projectLink,
  }: {
    chainId: number;
    programId: string;
    address: string;
    decimals: number;
    symbol: string;
    logoURI: string;
    name?: string;
    projectLink?: string;
    isNative?: boolean;
  });
  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and programId.
   * @param other other token to compare
   */
  equals(other: BaseCurrency): boolean;
  sortsBefore(other: SPLToken): boolean;
  get wrapped(): SPLToken;
  get serialize(): SerializedSPLToken;
}

/**
 * Represents the native currency of the chain on which it resides, e.g.
 */
export declare abstract class SPLNativeCurrency extends BaseCurrency<SPLToken> {
  readonly isNative: true;
  readonly isToken: false;
  readonly address: string;
}

export type Currency = NativeCurrency | Token;
export type UnifiedNativeCurrency = NativeCurrency | SPLNativeCurrency;
export type UnifiedCurrency = SPLToken | SPLNativeCurrency | Currency;
export type UnifiedToken = SPLToken | Token;

export declare class Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;
  constructor(numerator: BigintIsh, denominator?: BigintIsh);
  private static readonly tryParseFraction;
  get quotient(): bigint;
  get remainder(): Fraction;
  invert(): Fraction;
  add(other: Fraction | BigintIsh): Fraction;
  subtract(other: Fraction | BigintIsh): Fraction;
  lessThan(other: Fraction | BigintIsh): boolean;
  equalTo(other: Fraction | BigintIsh): boolean;
  greaterThan(other: Fraction | BigintIsh): boolean;
  multiply(other: Fraction | BigintIsh): Fraction;
  divide(other: Fraction | BigintIsh): Fraction;
  toSignificant(significantDigits: number, format?: object, rounding?: Rounding): string;
  toFixed(decimalPlaces: number, format?: object, rounding?: Rounding): string;
  /**
   * Helper method for converting any super class back to a fraction
   */
  get asFraction(): Fraction;
}

/**
 * Converts a fraction to a percent
 * @param fraction the fraction to convert
 */
export declare function toPercent(fraction: Fraction): Percent;
export declare class Percent extends Fraction {
  /**
   * This boolean prevents a fraction from being interpreted as a Percent
   */
  readonly isPercent: true;
  static readonly toPercent: typeof toPercent;
  add(other: Fraction | BigintIsh): Percent;
  subtract(other: Fraction | BigintIsh): Percent;
  multiply(other: Fraction | BigintIsh): Percent;
  divide(other: Fraction | BigintIsh): Percent;
  toSignificant(significantDigits?: number, format?: object, rounding?: Rounding): string;
  toFixed(decimalPlaces?: number, format?: object, rounding?: Rounding): string;
}

export declare class CurrencyAmount<T extends Currency> extends Fraction {
  readonly currency: T;
  readonly decimalScale: bigint;
  /**
   * Returns a new currency amount instance from the unitless amount of token, i.e. the raw amount
   * @param currency the currency in the amount
   * @param rawAmount the raw token or ether amount
   */
  static fromRawAmount<T extends Currency>(currency: T, rawAmount: BigintIsh): CurrencyAmount<T>;
  /**
   * Construct a currency amount with a denominator that is not equal to 1
   * @param currency the currency
   * @param numerator the numerator of the fractional token amount
   * @param denominator the denominator of the fractional token amount
   */
  static fromFractionalAmount<T extends Currency>(
    currency: T,
    numerator: BigintIsh,
    denominator: BigintIsh,
  ): CurrencyAmount<T>;
  protected constructor(currency: T, numerator: BigintIsh, denominator?: BigintIsh);
  add(other: CurrencyAmount<T>): CurrencyAmount<T>;
  subtract(value: bigint): CurrencyAmount<T>;
  subtract(other: CurrencyAmount<T>): CurrencyAmount<T>;
  multiply(other: Fraction | BigintIsh): CurrencyAmount<T>;
  divide(other: Fraction | BigintIsh): CurrencyAmount<T>;
  toSignificant(significantDigits?: number, format?: object, rounding?: Rounding): string;
  toFixed(decimalPlaces?: number, format?: object, rounding?: Rounding): string;
  toExact(format?: object): string;
  get wrapped(): CurrencyAmount<Token>;
  info(): string;
}

export declare class UnifiedCurrencyAmount<T extends UnifiedCurrency> extends Fraction {
  readonly currency: T;
  readonly decimalScale: bigint;
  /**
   * Returns a new currency amount instance from the unitless amount of token, i.e. the raw amount
   * @param currency the currency in the amount
   * @param rawAmount the raw token or ether amount
   */
  static fromRawAmount<T extends UnifiedCurrency>(currency: T, rawAmount: BigintIsh): UnifiedCurrencyAmount<T>;
  /**
   * Construct a currency amount with a denominator that is not equal to 1
   * @param currency the currency
   * @param numerator the numerator of the fractional token amount
   * @param denominator the denominator of the fractional token amount
   */
  static fromFractionalAmount<T extends UnifiedCurrency>(
    currency: T,
    numerator: BigintIsh,
    denominator: BigintIsh,
  ): UnifiedCurrencyAmount<T>;
  protected constructor(currency: T, numerator: BigintIsh, denominator?: BigintIsh);
  add(other: UnifiedCurrencyAmount<T>): UnifiedCurrencyAmount<T>;
  subtract(value: bigint): UnifiedCurrencyAmount<T>;
  subtract(other: UnifiedCurrencyAmount<T>): UnifiedCurrencyAmount<T>;
  multiply(other: Fraction | BigintIsh): UnifiedCurrencyAmount<T>;
  divide(other: Fraction | BigintIsh): UnifiedCurrencyAmount<T>;
  toSignificant(significantDigits?: number, format?: object, rounding?: Rounding): string;
  toFixed(decimalPlaces?: number, format?: object, rounding?: Rounding): string;
  toExact(format?: object): string;
  get wrapped(): UnifiedCurrencyAmount<UnifiedToken>;
  info(): string;
}

export declare class Price<TBase extends UnifiedCurrency, TQuote extends UnifiedCurrency> extends Fraction {
  readonly baseCurrency: TBase;
  readonly quoteCurrency: TQuote;
  readonly scalar: Fraction;
  /**
   * Construct a price, either with the base and quote currency amount, or the
   * @param args
   */
  constructor(
    ...args:
      | [TBase, TQuote, BigintIsh, BigintIsh]
      | [
          {
            baseAmount: UnifiedCurrencyAmount<TBase>;
            quoteAmount: UnifiedCurrencyAmount<TQuote>;
          },
        ]
  );
  /**
   * Flip the price, switching the base and quote currency
   */
  invert(): Price<TQuote, TBase>;
  /**
   * Multiply the price by another price, returning a new price. The other price must have the same base currency as this price's quote currency
   * @param other the other price
   */
  multiply<TOtherQuote extends UnifiedCurrency>(other: Price<TQuote, TOtherQuote>): Price<TBase, TOtherQuote>;
  /**
   * Return the amount of quote currency corresponding to a given amount of the base currency
   * @param currencyAmount the amount of base currency to quote against the price
   */
  quote(currencyAmount: UnifiedCurrencyAmount<TBase>): UnifiedCurrencyAmount<TQuote>;
  /**
   * Get the value scaled by decimals for formatting
   * @private
   */
  private get adjustedForDecimals();
  toSignificant(significantDigits?: number, format?: object, rounding?: Rounding): string;
  toFixed(decimalPlaces?: number, format?: object, rounding?: Rounding): string;
  get wrapped(): Price<TBase['wrapped'], TQuote['wrapped']>;
  /**
   * Create a price from base and quote currency and a decimal string
   * @param base
   * @param quote
   * @param value
   * @returns Price<TBase, TQuote> | undefined
   */
  static fromDecimal<TBase extends UnifiedCurrency, TQuote extends UnifiedCurrency>(
    base: TBase,
    quote: TQuote,
    value: string,
  ): Price<TBase, TQuote> | undefined;
}

/**
 * Indicates that the pair has insufficient reserves for a desired output amount. I.e. the amount of output cannot be
 * obtained by sending any amount of input.
 */
export declare class InsufficientReservesError extends Error {
  readonly isInsufficientReservesError: true;
  constructor();
}
/**
 * Indicates that the input amount is too small to produce any amount of output. I.e. the amount of input sent is less
 * than the price of a single unit of output after fees.
 */
export declare class InsufficientInputAmountError extends Error {
  readonly isInsufficientInputAmountError: true;
  constructor();
}

export declare function validateVMTypeInstance(value: bigint, vmType: VMType): void;
export declare function sqrt(y: bigint): bigint;
export declare function sortedInsert<T>(
  items: T[],
  add: T,
  maxSize: number,
  comparator: (a: T, b: T) => number,
): T | null;
/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
export declare function computePriceImpact<TBase extends Currency, TQuote extends Currency>(
  midPrice: Price<TBase, TQuote>,
  inputAmount: CurrencyAmount<TBase>,
  outputAmount: CurrencyAmount<TQuote>,
): Percent;
export declare function getTokenComparator(balances: {
  [tokenAddress: string]: CurrencyAmount<Token> | undefined;
}): (tokenA: Token, tokenB: Token) => number;
export declare function sortCurrencies<T extends Currency>(currencies: T[]): T[];
export declare function sortUnifiedCurrencies<T extends UnifiedCurrency>(currencies: T[]): T[];
export declare const isCurrencySorted: (currencyA: Currency, currencyB: Currency) => boolean;
export declare const isUnifiedCurrencySorted: (currencyA: UnifiedCurrency, currencyB: UnifiedCurrency) => boolean;
export declare function getCurrencyAddress(currency: Currency): `0x${string}`;
export declare function getUnifiedCurrencyAddress(currency: UnifiedCurrency): string;
export declare function getMatchedCurrency(
  currency: Currency,
  list: Currency[],
  matchWrappedCurrency?: boolean,
): Currency | undefined;

export type Tuple<T, N, R extends T[] = []> = R['length'] extends N ? R : Tuple<T, N, [...R, T]>;
export type Bytes32 = `0x${string}`;
/**
 * Hooks registration for all type pool
 * if the value is true, the hook will be registered
 */
export type HooksRegistration = {
  beforeInitialize?: boolean;
  afterInitialize?: boolean;
  beforeAddLiquidity?: boolean;
  afterAddLiquidity?: boolean;
  beforeRemoveLiquidity?: boolean;
  afterRemoveLiquidity?: boolean;
  beforeSwap?: boolean;
  afterSwap?: boolean;
  beforeDonate?: boolean;
  afterDonate?: boolean;
  beforeSwapReturnsDelta?: boolean;
  afterSwapReturnsDelta?: boolean;
  afterMintReturnsDelta?: boolean;
  afterBurnReturnsDelta?: boolean;
};
export type BinTree = {
  level0: Bytes32;
  level1: Record<number, Bytes32>;
  level2: Record<number, Bytes32>;
};
export declare enum BinLiquidityShape {
  Spot = 'Spot',
  Curve = 'Curve',
  BidAsk = 'BidAsk',
}
export declare enum POOL_TYPE {
  CLAMM = 'CL',
  Bin = 'Bin',
}
export type PoolType = `${POOL_TYPE}`;
export type CLPoolParameter = {
  /**
   * Hooks registration for the pool
   * @see {@link HooksRegistration}
   */
  hooksRegistration?: HooksRegistration;
  tickSpacing: number;
};
export type BinPoolParameter = {
  /**
   * Hooks registration for the pool
   * @see {@link HooksRegistration}
   */
  hooksRegistration?: HooksRegistration;
  binStep: number;
  tickSpacing: number;
};
/**
 * PoolKey is a unique identifier for a pool
 *
 * decoded version of `PoolKey`
 *
 */
export type PoolKey<TPoolType extends PoolType = 'CL' | 'Bin'> = {
  /**
   * the lower currency address of the pool, use zero address for native token
   */
  currency0: Address;
  /**
   * the higher currency address of the pool
   */
  currency1: Address;
  /**
   * the address of the hooks contract, if not set, use zero address
   */
  hooks?: Address;
  /**
   * the address of the pool manager contract
   */
  poolManager: Address;
  /**
   * the lp fee of the pool, the max fee for cl pool is 1_000_000(100%) and for bin, it is 100_000(10%).
   * If the pool has dynamic fee then it must be exactly equal to 0x800000
   *
   * @see DYNAMIC_FEE_FLAG
   */
  fee: number;
  /**
   * the parameters of the pool
   * include:
   *   1. hooks registration callback
   *   2. pool specific parameters: tickSpacing for CLPool, binStep for BinPool
   *
   * @see BinPoolParameter
   * @see CLPoolParameter
   * @see HooksRegistration
   */
  parameters: TPoolType extends 'CL'
    ? CLPoolParameter
    : TPoolType extends 'Bin'
      ? BinPoolParameter
      : CLPoolParameter | BinPoolParameter;
};
/**
 * encoded poolKey struct
 *
 * @see PoolKey
 * @see {@link https://github.com/pancakeswap/infinity-core/blob/main/src/types/PoolKey.sol|infinity-core}
 */
export type EncodedPoolKey = {
  currency0: Address;
  currency1: Address;
  hooks: Address;
  poolManager: Address;
  fee: number;
  parameters: Bytes32;
};
export type CLPositionConfig = {
  poolKey: PoolKey<'CL'>;
  tickLower: number;
  tickUpper: number;
};
export type EncodedCLPositionConfig = {
  poolKey: Prettify<
    Omit<PoolKey<'CL'>, 'parameters'> & {
      parameters: Bytes32;
    }
  >;
  tickLower: number;
  tickUpper: number;
};
export type BinPool = {
  poolType: 'Bin';
  token0: Currency;
  token1: Currency;
  fee: number;
  protocolFee: number;
  dynamic: boolean;
  activeId: number;
  binStep: number;
  hooksRegistration?: HooksRegistration | undefined;
};
export type CLSlot0 = {
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
};
export type BinSlot0 = {
  activeId: number;
  protocolFee: number;
  lpFee: number;
};
export type Slot0<TPoolType extends PoolType | unknown = unknown> = TPoolType extends 'CL'
  ? CLSlot0
  : TPoolType extends 'Bin'
    ? BinSlot0
    : unknown;
export type HookTag = 'CL' | 'Bin' | 'Dynamic' | (string & NonNullable<unknown>);
export declare enum HOOK_CATEGORY {
  DynamicFees = 'Dynamic Fees',
  LiquidityIncentivisation = 'Liquidity Incentivisation',
  YieldOptimisation = 'Yield Optimisation',
  JIT = 'JIT',
  MEV = 'MEV',
  RWA = 'RWA',
  ALM = 'ALM',
  CrossChain = 'Cross-Chain',
  Leverage = 'Leverage',
  PricingCurve = 'Pricing Curve',
  OrderType = 'Order Type',
  Oracle = 'Oracle',
  Others = 'Others',
  BrevisDiscount = 'Fee Discount (Brevis)',
  PrimusDiscount = 'Fee Discount (Primus)',
}
export interface HookData {
  address: Address;
  name?: string;
  category?: HOOK_CATEGORY[];
  description?: string;
  poolType?: POOL_TYPE;
  github?: string;
  audit?: string;
  learnMoreLink?: string;
  creator?: string;
  isVerified?: boolean;
  isUpgradable?: boolean;
  hooksRegistration?: HooksRegistration;
  hookType?: HookType;
  defaultFee?: number;
}
export declare enum HookType {
  Universal = 'Universal',
  PerPool = 'PerPool',
}
//# sourceMappingURL=types.d.ts.map
