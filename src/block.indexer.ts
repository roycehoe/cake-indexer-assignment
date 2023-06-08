import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block, Tx } from './providers/blockchain/_abstract';
import { CacheService } from './cache.service';

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
    private cacheService: CacheService,
  ) {}

  private async getTransactionAddressIndex(
    blocks: Block[],
  ): Promise<Map<string, Tx[]>> {
    const cachedData = (await this.cacheService.get(
      'transactionAddressIndex',
    )) as Map<string, Tx[]>;
    const transactions = blocks.flatMap((block) => block.tx);

    for (const transaction of transactions) {
      for (const vout of transaction.vout) {
        if (!vout.scriptPubKey.addresses) {
          continue;
        }
        for (const address of vout.scriptPubKey.addresses) {
          if (!cachedData.has(address)) {
            cachedData.set(address, []);
          }
          cachedData.get(address).push(transaction);
        }
      }
    }
    return cachedData;
  }

  private async getBlockHeightIndex(
    blocks: Block[],
  ): Promise<Map<number, Block>> {
    const cachedData = (await this.cacheService.get('blockHashIndex')) as Map<
      number,
      Block
    >;
    for (const block of blocks) {
      if (cachedData.get(block.height)) {
        continue;
      }
      cachedData.set(block.height, block);
    }
    return cachedData;
  }

  private async getBlockHashIndex(
    blocks: Block[],
  ): Promise<Map<string, Block>> {
    const cachedData = (await this.cacheService.get('blockHashIndex')) as Map<
      string,
      Block
    >;
    for (const block of blocks) {
      if (cachedData.get(block.hash)) {
        continue;
      }
      cachedData.set(block.hash, block);
    }
    return cachedData;
  }

  async getAllBlocks() {
    let cachedData = (await this.cacheService.get('allBlocks')) as Block[];

    let heightToResume =
      cachedData.length === 0
        ? 0
        : cachedData[cachedData.length - 1].height + 1;
    while (true) {
      const blockAtHeight = await this.blockchainClient.getBlocksAtHeight(
        heightToResume,
      );
      if (blockAtHeight.length === 0) {
        break;
      }
      cachedData = [...cachedData, ...blockAtHeight];
      await this.cacheService.set('allBlocks', cachedData, 0); // Update the cache each time a new block is fetched
      heightToResume += 1;
    }
    return cachedData;
  }

  async getAllBestChainedBlocks() {
    const allBlocks = await this.getAllBlocks();
    return getBestChainedBlocks(allBlocks);
  }

  async getBlocksBelowHeight(height: string): Promise<Block[]> {
    const allBlocks = await this.getAllBlocks();
    const bestChainedBlocks = getBestChainedBlocks(allBlocks);

    const blocksBelowHeight = bestChainedBlocks.filter(
      (block) => Number(height) <= block.height,
    );
    return blocksBelowHeight;
  }

  isHeight(heightOrHash: number | string) {
    return !isNaN(Number(heightOrHash));
  }

  async findBlock(heightOrHash?: string): Promise<Block> {
    const allBlocks = await this.getAllBlocks();
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
    const allBlocks = await this.getAllBlocks();
    const bestChainedBlocks = getBestChainedBlocks(allBlocks);
    const transactionAddressIndex = await this.getTransactionAddressIndex(
      bestChainedBlocks,
    );

    return transactionAddressIndex.get(address);
  }

  async onApplicationBootstrap(): Promise<void> {
    const allBlocksCache = await this.cacheService.get('allBlocks');
    if (allBlocksCache === undefined) {
      await this.cacheService.set('allBlocks', [], 0);
    }
    const blockHeightIndex = await this.cacheService.get('blockHeightIndex');
    if (blockHeightIndex === undefined) {
      await this.cacheService.set('blockHeightIndex', new Map(), 0);
    }
    const blockHashIndex = await this.cacheService.get('blockHashIndex');
    if (blockHashIndex === undefined) {
      await this.cacheService.set('blockHashIndex', new Map(), 0);
    }
    const transactionAddressIndex = await this.cacheService.get(
      'transactionAddressIndex',
    );
    if (transactionAddressIndex === undefined) {
      await this.cacheService.set('transactionAddressIndex', new Map(), 0);
    }
  }
}
