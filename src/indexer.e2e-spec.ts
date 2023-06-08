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
import { IndexerModule } from './indexer.module';

describe('Indexer e2e', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IndexerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/api/blocks', () => {
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
  it('should not lose indexed state if it goes down while indexing', () => {
    // More specifically, killing the service while it's indexing then bringing it back up again
    // should not result in re-indexing of the already indexed blocks
    throw Error('todo');
  });
});

describe('Block invalidation', () => {
  it('should not return blocks from invalidatedHeight onwards', async () => {
    // invalidating block 100 should invalidate block 100, 101, 102, ...
    throw Error('todo');
  });

  it('should not return transactions from invalidated blocks', async () => {
    // invalidating block 100 should invalidate all of its transactions
    // Assumption: Invalidation means, the block is missing from the blockchain
    throw Error('todo');
  });
});
