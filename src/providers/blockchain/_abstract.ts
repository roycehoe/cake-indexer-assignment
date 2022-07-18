/**
 * An abstraction of a Blockchain client with simple endpoints to fetch blocks.
 * In reality, blockchain clients provide more extensive APIs for interacting with the
 * underlying blockchain.
 */
export interface BlockchainClient {
  getBlockByHeight(height: number): Promise<Block>
}

export interface Block {
  hash: string
  height: number
  // TODO: add more fields
}
