import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
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
      throw Error('todo');
    });

    it('should return block by hash', async () => {
      throw Error('todo');
    });

    it('should list blocks', async () => {
      // return request(app.getHttpServer())
      //   .get('/api/blocks')
      //   .expect(200)
      //   .expect({});
      throw Error('todo');
    });

    describe('/api/blocks/{height}/transactions', () => {
      it('should list transactions for a given block', async () => {
        throw Error('todo');
      });
    });
  });

  describe('/api/addresses/{address}/transactions', () => {
    it('should list transactions for a given address', async () => {
      throw Error('todo');
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
    throw Error('todo');
  });
});
