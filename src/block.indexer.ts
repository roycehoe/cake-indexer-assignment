import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block } from './providers/blockchain/_abstract';
import { BlockIndexerSearchField, BlockIndexerSearchParams } from './types';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

function getBlockHashIndex(blocks: Block[]): Map<number, Block> {
  const blockHashIndex = new Map();
  for (const block of blocks) {
    blockHashIndex.set(block.hash, block);
  }
  return blockHashIndex;
}

function getBlockHeightIndex(blocks: Block[]): Map<number, Block> {
  const blockHeightIndex = new Map();
  const suspiciousBlocks: Block[] = [];
  let currentHeight = 0;

  for (let i = 0; i < blocks.length - 1; i++) {
    const currentBlock = blocks[i];
    const nextBlock = blocks[i + 1];
    if (
      nextBlock.previousblockhash === currentBlock.hash &&
      currentHeight !== nextBlock.height
    ) {
      //isLegitimateBlock
      blockHeightIndex.set(currentBlock.height, currentBlock);
      currentHeight = currentBlock.height;
      continue;
    }

    if (currentBlock.height === nextBlock.height) {
      suspiciousBlocks.push(currentBlock);
      continue;
    }

    if (nextBlock.height !== currentBlock.height) {
      blockHeightIndex.set(
        currentBlock.height,
        suspiciousBlocks.filter((block) => nextBlock.hash === block.hash)[0],
      );
    }
  }

  return blockHeightIndex;
}

function getTransactionAddressIndex(blocks: Block[]): Map<number, Block> {
  return new Map();
}

@Injectable()
export class BlockIndexer {
  blockHashIndex: Map<number, Block> = new Map();
  blockHeightIndex: Map<number, Block> = new Map();
  transactionAddressIndex: Map<number, Block> = new Map();

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
