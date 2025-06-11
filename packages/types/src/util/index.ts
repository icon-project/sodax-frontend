/**
 * Util types
 */

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type ExtractKeys<T> = T extends unknown ? keyof T : never;

export type Default = {
  default: boolean;
};
