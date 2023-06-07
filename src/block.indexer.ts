import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block, Tx } from './providers/blockchain/_abstract';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

function isLegitimateBlock(currentBlock: Block, nextBlock: Block): boolean {
  return nextBlock.previousblockhash === currentBlock.hash;
}

function isBlockChainBroken(currentBlock: Block, nextBlock: Block): boolean {
  return nextBlock.height - currentBlock.height > 1;
}

function getBestChainedBlocks(blocks: Block[]): Block[] {
  /*
  Assumptions:
   - The last block is always part of the best chianed block
   - The JsonBlockchainClient would always return blocks sorted by height, in ascending order. No sorting is needed, improving the time complexity of this function
  */
  if (blocks.length === 0) {
    return [];
  }

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

    if (isBlockChainBroken(currentBlock, nextBlock)) {
      return bestChain;
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

function getTransactionAddressIndex(blocks: Block[]): Map<string, Tx[]> {
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
  transactionAddressIndex: Map<string, Tx[]> = new Map();
  blocks: Block[] = [];

  constructor(private readonly blockchainClient: JsonBlockchainClient) {
    this.initializeIndexes();
  }

  private async initializeIndexes() {
    const allBlocks = await this.blockchainClient.getAllBlocks();
    this.blocks = getBestChainedBlocks(allBlocks);

    this.blockHeightIndex = getBlockHeightIndex(this.blocks);
    this.blockHashIndex = getBlockHashIndex(this.blocks);
    this.transactionAddressIndex = getTransactionAddressIndex(this.blocks);
  }

  getBlocksBelowHeight(height: string): Block[] {
    const blocksBelowHeight = this.blocks.filter(
      (block) => Number(height) <= block.height,
    );
    return blocksBelowHeight;
  }

  isHeight(heightOrHash: number | string) {
    return !!Number(heightOrHash);
  }

  getAllBlocks() {
    return this.blocks;
  }

  findBlock(heightOrHash?: string): Block {
    if (this.isHeight(heightOrHash)) {
      const height = Number(heightOrHash);
      return this.blockHeightIndex.get(height);
    }

    return this.blockHashIndex.get(heightOrHash);
  }

  getBlockTransactions(heightOrHash?: string): Tx[] {
    const block = this.findBlock(heightOrHash);
    return block.tx;
  }

  getAddressTransactions(address: string): Tx[] {
    return this.transactionAddressIndex.get(address);
  }
}
