import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/blocks')
export class IndexerController {
  @Get()
  getBlock(): string {
    return 'getBlock';
  }

  @Get(':height')
  getBlockByHeight(@Param('height') height: string): string {
    return `height:${height} getBlockByHeight`;
  }

  @Get(':maxHeight')
  getBlockByMaxHeight(@Param('maxHeight') maxHeight?: string): string {
    return `max height:${maxHeight} getBlockByMaxHeight`;
  }

  @Get(':hash')
  getBlockByHash(@Param('hash') hash: string): string {
    return `hash:${hash} getBlockByHash`;
  }
}
