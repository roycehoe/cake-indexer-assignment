import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
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

  return bestChain;
}

@Injectable()
export class BlockIndexer {
  constructor(
    private readonly blockchainClient: JsonBlockchainClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async withCacheing(
    key: string,
    callback: () => Promise<any>,
  ): Promise<any> {
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
    }
    const result = await callback();
    await this.cacheManager.set(key, result);
    return result;
  }

  private async getBlockHashIndex(
    blocks: Block[],
  ): Promise<Map<string, Block>> {
    return this.withCacheing('blockHashIndex', async () => {
      const blockHashIndex = new Map();
      for (const block of blocks) {
        blockHashIndex.set(block.hash, block);
      }
      return blockHashIndex;
    });
  }

  private async getBlockHeightIndex(
    blocks: Block[],
  ): Promise<Map<number, Block>> {
    return this.withCacheing('blockHeightIndex', async () => {
      const blockHeightIndex = new Map();
      for (const block of blocks) {
        blockHeightIndex.set(block.height, block);
      }
      return blockHeightIndex;
    });
  }

  private async getTransactionAddressIndex(
    blocks: Block[],
  ): Promise<Map<string, Tx[]>> {
    return this.withCacheing('transactionAddressIndex', async () => {
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
    });
  }

  async getBlocksBelowHeight(height: string): Promise<Block[]> {
    const allBlocks = await this.blockchainClient.getAllBlocks();
    const bestChainedBlocks = getBestChainedBlocks(allBlocks);

    const blocksBelowHeight = bestChainedBlocks.filter(
      (block) => Number(height) <= block.height,
    );
    return blocksBelowHeight;
  }

  isHeight(heightOrHash: number | string) {
    return !isNaN(Number(heightOrHash));
  }

  async getAllBlocks() {
    const allBlocks = await this.blockchainClient.getAllBlocks();
    return getBestChainedBlocks(allBlocks);
  }

  async findBlock(heightOrHash?: string): Promise<Block> {
    const allBlocks = await this.blockchainClient.getAllBlocks();
    const bestChainedBlocks = getBestChainedBlocks(allBlocks);
    const blockHeightIndex = await this.getBlockHeightIndex(bestChainedBlocks);

    if (this.isHeight(heightOrHash)) {
      const height = Number(heightOrHash);
      return blockHeightIndex.get(height);
    }

    const blockHashIndex = await this.getBlockHashIndex(bestChainedBlocks);
    return blockHashIndex.get(heightOrHash);
  }

  async getBlockTransactions(heightOrHash?: string): Promise<Tx[]> {
    const block = await this.findBlock(heightOrHash);
    return block.tx;
  }

  async getAddressTransactions(address: string): Promise<Tx[]> {
    const allBlocks = await this.blockchainClient.getAllBlocks();
    const bestChainedBlocks = getBestChainedBlocks(allBlocks);
    const transactionAddressIndex = await this.getTransactionAddressIndex(
      bestChainedBlocks,
    );

    return transactionAddressIndex.get(address);
  }
}
