import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlockIndexer } from './block.indexer';
import { Block, Tx } from './providers/blockchain/_abstract';

@Controller('api')
export class IndexerController {
  constructor(private readonly blockIndexer: BlockIndexer) {}

  @Get('blocks')
  getBlocksQuery(@Query('maxHeight') maxHeight?: string): Block[] {
    if (!maxHeight) {
      return this.blockIndexer.getAllBlocks();
    }
    return this.blockIndexer.getBlocksBelowHeight(maxHeight);
  }

  @Get('blocks/:heightOrHash')
  findBlocks(@Param('heightOrHash') heightOrHash: string): Block[] | Block {
    return this.blockIndexer.findBlock(heightOrHash);
  }

  @Get('blocks/:heightOrHash/transactions')
  getBlockTransactions(@Param('heightOrHash') heightOrHash: string): Tx[] {
    return this.blockIndexer.getBlockTransactions(heightOrHash);
  }

  @Get('blocks/:address/transactions')
  getAddressTransactions(
    @Param('address') heightOrHash: string,
  ): Block[] | Block {
    return this.blockIndexer.findBlock(heightOrHash);
  }
}
