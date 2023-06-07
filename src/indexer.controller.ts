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
  getBlocksQuery(@Query('maxHeight') maxHeight?: string): Block[] {
    if (!maxHeight) {
      return this.blockIndexer.getAllBlocks();
    }
    return this.blockIndexer.getBlocksBelowHeight(maxHeight);
  }

  @Get('api/blocks/:heightOrHash')
  findBlocks(@Param('heightOrHash') heightOrHash: string): Block[] | Block {
    return this.blockIndexer.findBlock(heightOrHash);
  }

  @Get('api/blocks/:heightOrHash/transactions')
  getBlockTransactions(@Param('heightOrHash') heightOrHash: string): Tx[] {
    return this.blockIndexer.getBlockTransactions(heightOrHash);
  }

  @Get('api/blocks/:address/transactions')
  getAddressTransactions(@Param('address') address: string): Tx[] {
    return this.blockIndexer.getAddressTransactions(address);
  }
}
