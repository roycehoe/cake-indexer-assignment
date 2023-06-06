import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BlockIndexer } from './block.indexer';
import { Block } from './providers/blockchain/_abstract';
import { BlockIndexerSearchParams } from './types';

@Controller('api/blocks')
export class IndexerController {
  constructor(private readonly blockIndexer: BlockIndexer) {}

  @Get()
  async getBlocks(@Query('maxHeight') maxHeight?: number): Promise<Block[]> {
    return this.blockIndexer.getBlocks(Number(maxHeight));
  }

  @Post()
  findBlocks(
    @Body() searchParam: BlockIndexerSearchParams,
  ): Promise<Block | Block[]> {
    return this.blockIndexer.findBlocks({
      field: searchParam.field,
      param: searchParam.param,
    });
  }
}
