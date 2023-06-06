import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BlockIndexer } from './block.indexer';

@Controller('api/blocks')
export class IndexerController {
  constructor(private readonly blockIndexer: BlockIndexer) {}

  @Get()
  getBlocks(@Query('maxHeight') maxHeight?: string): string {
    return this.blockIndexer.getBlock(maxHeight);
  }

  @Post()
  findBlocks(
    @Body() searchParam: { field: 'height' | 'hash'; param: string },
  ): {
    field: 'height' | 'hash';
    param: string;
  } {
    return this.blockIndexer.findBlocks({
      field: searchParam.field,
      param: searchParam.param,
    });
  }
}
