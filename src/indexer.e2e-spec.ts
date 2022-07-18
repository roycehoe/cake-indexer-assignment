import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
      throw Error('todo');
    });

    describe('/api/blocks/{height}/transactions', () => {
      it('should list transactions for a given block', async () => {
        throw Error('todo');
      });
    });

    describe('Block invalidation', () => {
      it('should not return invalidated blocks', async () => {
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
