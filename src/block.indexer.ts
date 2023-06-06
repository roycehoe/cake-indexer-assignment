import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

@Injectable()
export class BlockIndexer {
  constructor(private readonly blockchainClient: JsonBlockchainClient) {}
  getBlock(height?: string): string {
    if (height) {
      return `maxHeight:${height} getBlockByMaxHeight`;
    }
    return 'getBlock';
  }

  findBlocks(searchParam: { field: 'height' | 'hash'; param: string }): {
    field: 'height' | 'hash';
    param: string;
  } {
    return searchParam;
  }
}
