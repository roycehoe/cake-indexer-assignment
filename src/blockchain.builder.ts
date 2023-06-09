import { Injectable } from '@nestjs/common';
import { Block } from './providers/blockchain/_abstract';

type BlockchainDAGGraph = { [hash: string]: Block[] };

@Injectable()
export class BlockchainBuilder {
  private getBlockchainDAGGraph(blocks: Block[]): BlockchainDAGGraph {
    const blockchainGraph: BlockchainDAGGraph = {};

    for (const block of blocks) {
      if (!blockchainGraph[block.previousblockhash]) {
        blockchainGraph[block.previousblockhash] = [];
      }
      blockchainGraph[block.previousblockhash].push(block);
    }
    return blockchainGraph;
  }

  private getBestChainFromStartingBlock(
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

  private containsGenesisBlock(currentChain: Block[], genesisBlock: Block) {
    const filteredData = currentChain.filter(
      (block) => block.height === genesisBlock.height,
    );
    return filteredData.length >= 0;
  }

  getBestChainedBlocks(blocks: Block[]): Block[] {
    const graph = this.getBlockchainDAGGraph(blocks);
    const visited = new Set() as Set<string>;
    const genesisBlock = blocks[0];
    let bestChain: Block[] = [];

    for (const block of blocks) {
      // isUntraversed
      if (visited.has(block.hash)) {
        continue;
      }

      const currentChain = this.getBestChainFromStartingBlock(
        graph,
        visited,
        block,
      );
      if (!this.containsGenesisBlock(currentChain, genesisBlock)) {
        continue;
      }
      if (currentChain.length <= bestChain.length) {
        continue;
      }

      bestChain = currentChain;
    }

    return bestChain;
  }
}
