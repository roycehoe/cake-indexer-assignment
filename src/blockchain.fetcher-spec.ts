import { Test, TestingModule } from '@nestjs/testing';
import { MOCK_BLOCK_HEIGHT_0 } from '../test/mockBlock';
import { BlockchainFetcher } from './blockchain.fetcher';
import { CacheService } from './cache.service';
import { JsonBlockchainClient } from './providers/blockchain/JsonBlockchainClient';

describe('BlockchainFetcher', () => {
  let blockchainFetcher: BlockchainFetcher;
  let cacheService: jest.Mocked<CacheService>;
  let blockchainClient: jest.Mocked<JsonBlockchainClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainFetcher,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: JsonBlockchainClient,
          useValue: {
            getBlocksAtHeight: jest.fn(),
          },
        },
      ],
    }).compile();

    blockchainFetcher = module.get<BlockchainFetcher>(BlockchainFetcher);
    cacheService = module.get(CacheService);
    blockchainClient = module.get(JsonBlockchainClient);
  });

  it('should be defined', () => {
    expect(blockchainFetcher).toBeDefined();
  });

  describe('getHeightToResume', () => {
    it('should return 0 if cache is empty', async () => {
      cacheService.get.mockResolvedValue([]);

      const result = await blockchainFetcher.getHeightToResume();

      expect(result).toBe(0);
    });

    it('should return height of the last block plus one', async () => {
      cacheService.get.mockResolvedValue([MOCK_BLOCK_HEIGHT_0]);

      const result = await blockchainFetcher.getHeightToResume();

      expect(result).toBe(1);
    });
  });

  describe('getAllBlocks', () => {
    it('should return all blocks', async () => {
      cacheService.get.mockResolvedValueOnce([]);
      cacheService.get.mockResolvedValueOnce([MOCK_BLOCK_HEIGHT_0]);
      blockchainClient.getBlocksAtHeight.mockResolvedValueOnce([
        MOCK_BLOCK_HEIGHT_0,
      ]);
      blockchainClient.getBlocksAtHeight.mockResolvedValueOnce([]);

      const result = await blockchainFetcher.getAllBlocks();

      expect(result).toEqual([MOCK_BLOCK_HEIGHT_0]);
    });
  });

  describe('onApplicationBootstrap', () => {
    it('should set empty array in cache if undefined', async () => {
      cacheService.get.mockResolvedValue(undefined);

      await blockchainFetcher.onApplicationBootstrap();

      expect(cacheService.set).toHaveBeenCalledWith('allBlocks', [], 0);
    });

    it('should not set anything in cache if not undefined', async () => {
      cacheService.get.mockResolvedValue([MOCK_BLOCK_HEIGHT_0]);

      await blockchainFetcher.onApplicationBootstrap();

      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });
});
