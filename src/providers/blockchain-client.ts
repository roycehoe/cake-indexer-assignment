import { Injectable } from "@nestjs/common";

export interface Block {
  hash: string
  height: number
  // TODO: add more fields
}

/**
 * An abstraction of a Blockchain client with a
 * single endpoint to fetch blocks based on height
 */
export interface BlockchainClient {
  getBlockByHeight(height: number): Promise<Block>
}

/**
 * An in-memory BlockchainClient that holds a copy of the "blockchain",
 * purely for the purposes of this technical assignment.
 */
@Injectable()
export class InMemoryBlockchainClient implements BlockchainClient {
  constructor(private readonly blocks: Block[]) {
  }

  async getBlockByHeight(height: number): Promise<Block | undefined> {
    const blocks = this.blocks.filter(block => block.height)
    return blocks[0]
  }
}
