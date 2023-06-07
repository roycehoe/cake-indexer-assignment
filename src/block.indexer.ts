import { Injectable } from '@nestjs/common';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block, Tx } from './providers/blockchain/_abstract';

/**
 * TODO: Index the blocks provided by the client and expose via RESTful endpoint
 */

type BlockchainDAGGraph = { [hash: string]: Block[] };

function getBlockchainDAGGraph(blocks: Block[]): BlockchainDAGGraph {
  const blockchainGraph: BlockchainDAGGraph = {};

  for (const block of blocks) {
    if (!blockchainGraph[block.previousblockhash]) {
      blockchainGraph[block.previousblockhash] = [];
    }
    blockchainGraph[block.previousblockhash].push(block);
  }
  return blockchainGraph;
}

function getBestChainFromStartingBlock(
  graph: BlockchainDAGGraph,
  visited: Set<string>,
  startBlock: Block,
): Block[] {
  const stack = [{ block: startBlock, chain: [startBlock] }];
  let bestChain = [];

  while (stack.length > 0) {
    const { block, chain } = stack.pop();
    visited.add(block.hash);

    if (chain.length > bestChain.length) {
      bestChain = chain;
    }

    const children = graph[block.hash];
    if (!children) {
      continue;
    }
    for (const child of children) {
      if (visited.has(child.hash)) {
        continue;
      }

      stack.push({ block: child, chain: [...chain, child] });
    }
  }

  return bestChain;
}

function containsGenesisBlock(currentChain: Block[], genesisBlock: Block) {
  const filteredData = currentChain.filter(
    (block) => block.height === genesisBlock.height,
  );
  return filteredData.length >= 0;
}

function getBestChainedBlocks(blocks: Block[]): Block[] {
  const graph = getBlockchainDAGGraph(blocks);
  const visited = new Set() as Set<string>;
  const genesisBlock = blocks[0];
  let bestChain: Block[] = [];

  for (const block of blocks) {
    // isUntraversed
    if (visited.has(block.hash)) {
      continue;
    }

    const currentChain = getBestChainFromStartingBlock(graph, visited, block);
    if (!containsGenesisBlock(currentChain, genesisBlock)) {
      continue;
    }
    if (currentChain.length <= bestChain.length) {
      continue;
    }

    bestChain = currentChain;
  }
  console.log(bestChain);

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
