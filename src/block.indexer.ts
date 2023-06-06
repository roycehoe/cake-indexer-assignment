import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block } from './providers/blockchain/_abstract';
import { BlockIndexerSearchField, BlockIndexerSearchParams } from './types';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

@Injectable()
export class BlockIndexer {
  constructor(private readonly blockchainClient: JsonBlockchainClient) {}

  async getBlocks(height?: number): Promise<Block[]> {
    if (height) {
      const allBlocksAtHeight =
        await this.blockchainClient.getBlocksOfMaxHeight(height);
      return allBlocksAtHeight;
    }
    const allBlocks = await this.blockchainClient.getAllBlocks();
    return allBlocks;
  }

  async findBlocks(searchParam: BlockIndexerSearchParams): Promise<Block> {
    if (searchParam.field === BlockIndexerSearchField.HASH) {
      const foundBlocks = await this.blockchainClient.getBlockByHash(
        searchParam.param,
      );
      return foundBlocks;
    }

    const foundBlocks = await this.blockchainClient.getBlocksAtHeight(
      Number(searchParam.param),
    );
    return foundBlocks[0];
  }
}
