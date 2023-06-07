import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlockIndexer } from './block.indexer';
import { Block } from './providers/blockchain/_abstract';

@Controller('api/blocks')
export class IndexerController {
  constructor(private readonly blockIndexer: BlockIndexer) {}

  @Get()
  getBlocksQuery(@Query('maxHeight') maxHeight?: string): Block[] {
    if (!maxHeight) {
      return this.blockIndexer.getAllBlocks();
    }
    return this.blockIndexer.getBlocksBelowHeight(maxHeight);
  }

  @Get(':heightOrHash')
  findBlocks(@Param('heightOrHash') heightOrHash: string): Block[] | Block {
    return this.blockIndexer.findBlocks(heightOrHash);
  }
}
