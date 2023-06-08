import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlockIndexer } from './block.indexer';
import { Block, Tx } from './providers/blockchain/_abstract';

@Controller()
export class IndexerController {
  constructor(private readonly blockIndexer: BlockIndexer) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('api/blocks')
  async getBlocksQuery(
    @Query('maxHeight') maxHeight?: string,
  ): Promise<Block[]> {
    if (!maxHeight) {
      const result = await this.blockIndexer.getAllBestChainedBlocks();
      return result;
    }
    const result = await this.blockIndexer.getBlocksBelowHeight(maxHeight);
    return result;
  }

  @Get('api/blocks/:heightOrHash')
  async findBlocks(
    @Param('heightOrHash') heightOrHash: string,
  ): Promise<Block[] | Block> {
    const result = await this.blockIndexer.findBlock(heightOrHash);
    return result;
  }

  @Get('api/blocks/:heightOrHash/transactions')
  async getBlockTransactions(
    @Param('heightOrHash') heightOrHash: string,
  ): Promise<Tx[]> {
    const result = await this.blockIndexer.getBlockTransactions(heightOrHash);
    return result;
  }

  @Get('api/addresses/:address/transactions')
  async getAddressTransactions(
    @Param('address') address: string,
  ): Promise<Tx[]> {
    const result = await this.blockIndexer.getAddressTransactions(address);
    return result;
  }
}
