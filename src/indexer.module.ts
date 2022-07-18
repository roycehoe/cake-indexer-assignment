import { Module } from '@nestjs/common';
import { resolve, join } from 'path';
import { IndexerController } from './indexer.controller';
import { JSON_BLOCKS, JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import {BlockIndexer} from "./block.indexer";

@Module({
  imports: [],
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
      useValue: resolve(join(__dirname, '..', 'test', 'resources', '200.json'))
    }
  ]
})
export class IndexerModule {}
