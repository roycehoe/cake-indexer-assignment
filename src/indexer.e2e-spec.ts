import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import {
  EXPECTED_VALID_BLOCKS,
  EXPECTED_VALID_BLOCK_HASH_d744db74fb70ed42767ae028a129365fb4d7de54ba1b6575fb047490554f8a7b,
  EXPECTED_VALID_BLOCK_HEIGHT_0,
} from '../test/expectedBlocks';

import {
  EXPECTED_TRANSACTIONS_ADDRESS_msER9bmJjyEemRpQoS8YYVL21VyZZrSgQ7,
  EXPECTED_TRANSACTIONS_HEIGHT_0,
} from '../test/expectedTransactions';
import {
  MOCK_API_RESPONSE_MISSING_BLOCK_HEIGHT_100,
  MOCK_INDEXER_SHUTDOWN_AT_HEIGHT_30,
} from '../test/mockMissingBlocks';
import { MOCK_API_RESPONSE_MISSING_TXID_9fb9c46b1d12dae8a4a35558f7ef4b047df3b444b1ead61d334e4f187f5f58b7 } from '../test/mockMissingTransactions';
import { BlockchainFetcher } from './blockchain.fetcher';
import { CacheService } from './cache.service';
import { IndexerModule } from './indexer.module';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';
import { Block } from './providers/blockchain/_abstract';

describe('Indexer e2e', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IndexerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should display a "Hello World!" message', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('', () => {
    it('should return block by height', async () => {
      return request(app.getHttpServer())
        .get('/api/blocks/0')
        .expect(200)
        .expect(EXPECTED_VALID_BLOCK_HEIGHT_0);
    });

    it('should return block by hash', async () => {
      return request(app.getHttpServer())
        .get(
          '/api/blocks/d744db74fb70ed42767ae028a129365fb4d7de54ba1b6575fb047490554f8a7b',
        )
        .expect(200)
        .expect(
          EXPECTED_VALID_BLOCK_HASH_d744db74fb70ed42767ae028a129365fb4d7de54ba1b6575fb047490554f8a7b,
        );
    });

    it('should list blocks', async () => {
      return request(app.getHttpServer())
        .get('/api/blocks')
        .expect(200)
        .expect(EXPECTED_VALID_BLOCKS);
    });

    describe('/api/blocks/{height}/transactions', () => {
      it('should list transactions for a given block', async () => {
        return request(app.getHttpServer())
          .get('/api/blocks/0/transactions')
          .expect(200)
          .expect(EXPECTED_TRANSACTIONS_HEIGHT_0);
      });
    });
  });

  describe('/api/addresses/{address}/transactions', () => {
    it('should list transactions for a given address', async () => {
      return request(app.getHttpServer())
        .get('/api/addresses/msER9bmJjyEemRpQoS8YYVL21VyZZrSgQ7/transactions')
        .expect(200)
        .expect(
          EXPECTED_TRANSACTIONS_ADDRESS_msER9bmJjyEemRpQoS8YYVL21VyZZrSgQ7,
        );
    });
  });
});

describe('Indexer durability', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IndexerModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore the original implementation after each test
  });
  it('should cache data', async () => {
    const cacheService = app.get<CacheService>(CacheService);
    await cacheService.set('allBlocks', MOCK_INDEXER_SHUTDOWN_AT_HEIGHT_30, 0);

    const cachedData = await cacheService.get('allBlocks');

    expect(JSON.stringify(cachedData)).toBe(
      JSON.stringify(MOCK_INDEXER_SHUTDOWN_AT_HEIGHT_30),
    );
  });
  it('should not lose indexed state if it goes down while indexing', async () => {
    jest.mock('./indexer.module', () => {
      throw new Error('service is down');
    });
    const cacheService = app.get<CacheService>(CacheService);

    const cachedData = await cacheService.get('allBlocks');

    expect(JSON.stringify(cachedData)).toBe(
      JSON.stringify(MOCK_INDEXER_SHUTDOWN_AT_HEIGHT_30),
    );
  });

  it('should start reindexing from previous state', async () => {
    const jsonBlockchainClient =
      app.get<JsonBlockchainClient>(JsonBlockchainClient);
    const spy = jest.spyOn(jsonBlockchainClient, 'getBlocksAtHeight');

    await request(app.getHttpServer()).get('/api/blocks');

    expect(spy).toHaveBeenCalledTimes(170);

    spy.mockRestore();
  });
});

describe('Block invalidation', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IndexerModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  afterEach(() => {
    jest.restoreAllMocks(); // Restore the original implementation after each test
  });

  it('should not return blocks from invalidatedHeight onwards', async () => {
    // invalidating block 100 should invalidate block 100, 101, 102, ...
    const blockchainFetcher = app.get<BlockchainFetcher>(BlockchainFetcher);
    jest
      .spyOn(blockchainFetcher, 'getAllBlocks')
      .mockResolvedValue(MOCK_API_RESPONSE_MISSING_BLOCK_HEIGHT_100 as Block[]);

    return request(app.getHttpServer())
      .get('/api/blocks?maxHeight=100')
      .expect(200)
      .expect([]);
  });

  it('should not return transactions from invalidated blocks', async () => {
    // invalidating block 100 should invalidate all of its transactions
    // Assumption: Invalidation means, the block is missing from the blockchain
    const blockchainFetcher = app.get<BlockchainFetcher>(BlockchainFetcher);
    jest
      .spyOn(blockchainFetcher, 'getAllBlocks')
      .mockResolvedValue(
        MOCK_API_RESPONSE_MISSING_TXID_9fb9c46b1d12dae8a4a35558f7ef4b047df3b444b1ead61d334e4f187f5f58b7 as Block[],
      );

    return request(app.getHttpServer())
      .get(
        '/api/addresses/9fb9c46b1d12dae8a4a35558f7ef4b047df3b444b1ead61d334e4f187f5f58b7/transactions',
      )
      .expect(200)
      .expect({});
  });
});
