import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { readFileSync } from 'fs';
import type { Block, BlockchainClient } from './_abstract';

export const JSON_BLOCKS = 'JSON_BLOCKS'

/**
 * A blockchain client stub that holds a copy of the 'blockchain' as in-memory json objects
 * purely for the purposes of this technical assignment.
 */
@Injectable()
export class JsonBlockchainClient implements BlockchainClient, OnApplicationBootstrap {
  private blocks: Block[]

  constructor(@Inject(JSON_BLOCKS) private readonly path: string) {
  }

  /**
   * Called by Nest as part of app start-up phase
   * @see https://docs.nestjs.com/fundamentals/lifecycle-events
   */
  onApplicationBootstrap(): void {
    this.blocks = JSON.parse(readFileSync(this.path).toString()) as Block[];
  }

  /**
   * Fetches the block from a blockchain, simulating non-deterministic response time
   */
  async getBlockByHeight(height: number): Promise<Block | undefined> {
    const blocks = this.blocks.filter(block => height === block.height);
    return blocks[0];
  }

  async getBlockByHash(hash: string): Promise<Block | undefined> {
    const blocks = this.blocks.filter(block => hash === block.hash);
    return blocks[0];
  }
}
