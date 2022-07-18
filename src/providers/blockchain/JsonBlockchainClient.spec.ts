import { JSON_BLOCKS, JsonBlockchainClient } from './JsonBlockchainClient';
import { resolve, join } from 'path';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';

describe('JsonFileBlockchain', () => {
  let blockchainClient: JsonBlockchainClient;

  const pathToJsonBlocks = resolve(
    join(__dirname, '..', '..', '..', 'test', 'resources', '200.json'),
  );
  const jsonBlocks = JSON.parse(readFileSync(pathToJsonBlocks).toString());

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        JsonBlockchainClient,
        {
          provide: JSON_BLOCKS,
          useValue: pathToJsonBlocks,
        },
      ],
    }).compile();

    await moduleFixture.init();
    blockchainClient = moduleFixture.get(JsonBlockchainClient);
  });

  it('should serve blocks in json file as blockchain data', async () => {
    expect(await blockchainClient.getBlocksAtHeight(0)).toStrictEqual([
      jsonBlocks[0],
    ]);
    expect(await blockchainClient.getBlocksAtHeight(100)).toStrictEqual([
      jsonBlocks[100],
    ]);
    expect(await blockchainClient.getBlocksAtHeight(199)).toStrictEqual([
      jsonBlocks[200], // offset by 1 due to fork (2 blocks) at height 198
    ]);
  });

  it('should get block count', async () => {
    expect(await blockchainClient.getBlockCount()).toStrictEqual(200);
  });

  it('should get block by height', async () => {
    expect(await blockchainClient.getBlocksAtHeight(0)).toStrictEqual([
      jsonBlocks[0],
    ]);
  });

  it('should get block by hash', async () => {
    expect(
      await blockchainClient.getBlockByHash(
        'd744db74fb70ed42767ae028a129365fb4d7de54ba1b6575fb047490554f8a7b',
      ),
    ).toStrictEqual(jsonBlocks[0]);
  });

  it('should return forked blocks at height 198', async () => {
    expect(await blockchainClient.getBlocksAtHeight(198)).toStrictEqual([
      {
        hash: 'ef61aaf7f6f742ed825922b10ec504ee74cfcb9c71037706dd8a87c627f541f9',
        ...jsonBlocks[198],
      },
      {
        hash: 'ef61aaf7f6f742ed825922b10ec504ee74cfcb9c71037706dd8a8FORKEDBLOCK',
        ...jsonBlocks[199],
      },
    ]);
  });
});
