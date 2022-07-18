import { JSON_BLOCKS, JsonBlockchainClient } from './JsonBlockchainClient';
import { resolve, join } from 'path';
import { Test } from '@nestjs/testing';
import { readFileSync } from "fs";

describe('JsonFileBlockchain', () => {

  let blockchainClient: JsonBlockchainClient;

  const pathToJsonBlocks = resolve(
    join(__dirname, '..', '..', '..', 'test', 'resources', '200.json')
  );

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        JsonBlockchainClient,
        {
          provide: JSON_BLOCKS,
          useValue: pathToJsonBlocks
        }
      ],
    }).compile();

    await moduleFixture.init();
    blockchainClient = moduleFixture.get(JsonBlockchainClient);
  });

  it('should serve blocks in json file as blockchain data', async () => {
    const jsonBlocks = JSON.parse(readFileSync(pathToJsonBlocks).toString())

    expect(await blockchainClient.getBlockByHeight(0)).toStrictEqual(jsonBlocks[0]);
    expect(await blockchainClient.getBlockByHeight(100)).toStrictEqual(jsonBlocks[100]);
    expect(await blockchainClient.getBlockByHeight(200)).toStrictEqual(jsonBlocks[200]);
  })
})
