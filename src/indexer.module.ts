import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { join, resolve } from 'path';
import { BlockIndexer } from './block.indexer';
import { IndexerController } from './indexer.controller';
import {
  JSON_BLOCKS,
  JsonBlockchainClient,
} from './providers/blockchain/JsonBlockchainClient';

@Module({
  imports: [CacheModule.register()],
  controllers: [IndexerController],
  providers: [
    BlockIndexer,

    // To keep this assignment simple, we'll provide the JsonBlockchainClient
    // and the path to the 200.json here.
    // In the real world, we'll probably provide an actual blockchain client connector
    // and required configs via ConfigModule.
    JsonBlockchainClient,
    {
      provide: JSON_BLOCKS,
      useValue: resolve(join(__dirname, '..', 'test', 'resources', '200.json')),
    },
  ],
})
export class IndexerModule {}
