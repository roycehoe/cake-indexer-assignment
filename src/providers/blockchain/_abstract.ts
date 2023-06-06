/**
 * An abstraction of a Blockchain client with simple endpoints to fetch blocks.
 * In reality, blockchain clients provide more extensive APIs for interacting with the
 * underlying blockchain.
 */
export interface BlockchainClient {
  getBlockCount(): Promise<number>;
  getBlockByHash(hash: string): Promise<Block | undefined>;
  getBlocksAtHeight(height: number): Promise<Block[] | undefined>;
}

export interface Block {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  masternode: string;
  minter: string;
  mintedBlocks: number;
  stakeModifier: string;
  version: number;
  versionHex: string;
  merkleroot: string;
  nonutxo: Nonutxo[];
  tx: Tx[];
  time: number;
  mediantime: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  nextblockhash: string;
}

export interface Nonutxo {
  AnchorReward: number;
  Burnt: number;
}

export interface Tx {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  hex: string;
}

export interface Vin {
  coinbase?: string;
  sequence: number;
  txid?: string;
  vout?: number;
  scriptSig?: ScriptSig;
}

export interface ScriptSig {
  asm: string;
  hex: string;
}

export interface Vout {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
  tokenId: number;
}

export interface ScriptPubKey {
  asm: string;
  hex: string;
  reqSigs?: number;
  type: string;
  addresses?: string[];
}
