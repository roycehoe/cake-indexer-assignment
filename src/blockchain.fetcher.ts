import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block } from './providers/blockchain/_abstract';

@Injectable()
export class BlockchainFetcher {
  constructor(
    private readonly blockchainClient: JsonBlockchainClient,
    private cacheService: CacheService,
  ) {}

  private async getHeightToResume(): Promise<number> {
    const cachedData = (await this.cacheService.get('allBlocks')) as Block[];

    if (cachedData.length === 0) {
      return 0;
    }
    return cachedData[cachedData.length - 1].height + 1;
  }

  async getAllBlocks(): Promise<Block[]> {
    let cachedData = (await this.cacheService.get('allBlocks')) as Block[];
    let heightToResume = await this.getHeightToResume();

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

  async onApplicationBootstrap(): Promise<void> {
    const allBlocksCache = await this.cacheService.get('allBlocks');
    if (allBlocksCache === undefined) {
      await this.cacheService.set('allBlocks', [], 0);
    }
  }
}
