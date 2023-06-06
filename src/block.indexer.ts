import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block, Tx } from './providers/blockchain/_abstract';
import { BlockIndexerSearchField, BlockIndexerSearchParams } from './types';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

function isLegitimateBlock(currentBlock: Block, nextBlock: Block) {
  return nextBlock.previousblockhash === currentBlock.hash;
}

function getBestChainedBlocks(blocks: Block[]): Block[] {
  const bestChain: Block[] = [];
  const quarantinedBlocks: Block[] = [];
  let currentHeight = 0;

  for (let i = 0; i < blocks.length - 1; i++) {
    const currentBlock = blocks[i];
    const nextBlock = blocks[i + 1];
    if (isLegitimateBlock(currentBlock, nextBlock)) {
      bestChain.push(currentBlock);
      currentHeight = nextBlock.height;
      continue;
    }

    if (currentBlock.height === nextBlock.height) {
      quarantinedBlocks.push(currentBlock);
      continue;
    }
    bestChain.push(
      quarantinedBlocks.filter(
        (block) => nextBlock.previousblockhash === block.hash,
      )[0],
    );
  }

  bestChain.push(blocks.at(-1));
  return bestChain;
}

function getBlockHashIndex(blocks: Block[]): Map<string, Block> {
  const blockHashIndex = new Map();
  for (const block of blocks) {
    blockHashIndex.set(block.hash, block);
  }
  return blockHashIndex;
}

function getBlockHeightIndex(blocks: Block[]): Map<number, Block> {
  const blockHeightIndex = new Map();
  for (const block of blocks) {
    blockHeightIndex.set(block.height, block);
  }
  return blockHeightIndex;
}

function getTransactionAddressIndex(blocks: Block[]): Map<number, Tx> {
  const transactionAddressIndex = new Map();
  const transactions = blocks.flatMap((block) => block.tx);

  for (const transaction of transactions) {
    for (const vout of transaction.vout) {
      if (!vout.scriptPubKey.addresses) {
        continue;
      }
      for (const address of vout.scriptPubKey.addresses) {
        if (!transactionAddressIndex.has(address)) {
          transactionAddressIndex.set(address, []);
        }

        transactionAddressIndex.get(address).push(transaction);
      }
    }
  }

  return transactionAddressIndex;
}

@Injectable()
export class BlockIndexer {
  blockHashIndex: Map<string, Block> = new Map();
  blockHeightIndex: Map<number, Block> = new Map();
  transactionAddressIndex: Map<number, Tx> = new Map();

  constructor(private readonly blockchainClient: JsonBlockchainClient) {
    this.initializeIndexes();
  }

  private async initializeIndexes() {
    const allBlocks = await this.blockchainClient.getAllBlocks();
    const bestChainedBlocks = getBestChainedBlocks(allBlocks);

    this.blockHeightIndex = getBlockHeightIndex(bestChainedBlocks);
    this.blockHashIndex = getBlockHashIndex(bestChainedBlocks);
    this.transactionAddressIndex =
      getTransactionAddressIndex(bestChainedBlocks);
  }

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
