/**
 * Recursive partial type. Every property (including nested ones) becomes optional.
 * Arrays and primitives are kept as-is — they are replaced wholesale by `deepMerge`,
 * not merged element-by-element.
 */
export type DeepPartial<T> = T extends readonly (infer U)[]
  ? readonly U[]
  : T extends (infer U)[]
    ? U[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
