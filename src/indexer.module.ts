import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';

@Module({
  imports: [],
  controllers: [IndexerController],
})
export class IndexerModule {}
