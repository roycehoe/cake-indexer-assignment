import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block, Tx } from './providers/blockchain/_abstract';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

function isLegitimateBlock(currentBlock: Block, nextBlock: Block) {
  return nextBlock.previousblockhash === currentBlock.hash;
}

function getBestChainedBlocks(blocks: Block[]): Block[] {
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

  findBlocks(heightOrHash?: string): Block {
    if (this.isHeight(heightOrHash)) {
      const height = Number(heightOrHash);
      return this.blockHeightIndex.get(height);
    }

    return this.blockHashIndex.get(heightOrHash);
  }

  getBlockTransactions(heightOrHash?: string): Tx[] {
    const block = this.findBlocks(heightOrHash);
    return block.tx;
  }
}
