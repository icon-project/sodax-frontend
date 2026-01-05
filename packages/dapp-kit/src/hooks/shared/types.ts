export type QueryHookParams<ParamType, QueryOptionType> = {
  params: ParamType | undefined;
  queryOptions?: QueryOptionType;
}