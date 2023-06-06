export enum BlockIndexerSearchField {
  HEIGHT = 'height',
  HASH = 'hash',
}

export interface BlockIndexerSearchParams {
  field: BlockIndexerSearchField;
  param: string;
}
