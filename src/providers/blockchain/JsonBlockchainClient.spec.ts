import { JSON_BLOCKS, JsonBlockchainClient } from './JsonBlockchainClient';
import { resolve, join } from 'path';
import { Test } from '@nestjs/testing';
import { readFileSync } from "fs";

describe('JsonFileBlockchain', () => {

  let blockchainClient: JsonBlockchainClient;

  const pathToJsonBlocks = resolve(
    join(__dirname, '..', '..', '..', 'test', 'resources', '200.json')
  );
  const jsonBlocks = JSON.parse(readFileSync(pathToJsonBlocks).toString());

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
    expect(await blockchainClient.getBlockByHeight(0)).toStrictEqual(jsonBlocks[0]);
    expect(await blockchainClient.getBlockByHeight(100)).toStrictEqual(jsonBlocks[100]);
    expect(await blockchainClient.getBlockByHeight(200)).toStrictEqual(jsonBlocks[200]);
  });

  it('should get chain height', async () => {
    const height = await blockchainClient.getChainHeight();
    expect(height).toStrictEqual(jsonBlocks.length);
    expect(height).toStrictEqual(200);
  })

  it('should get block by height', async () => {
    expect(await blockchainClient.getBlockByHeight(0))
      .toStrictEqual(jsonBlocks[0]);
  })

  it('should get block by hash', async () => {
    expect(await blockchainClient.getBlockByHash('d744db74fb70ed42767ae028a129365fb4d7de54ba1b6575fb047490554f8a7b'))
      .toStrictEqual(jsonBlocks[0]);
  })
})
