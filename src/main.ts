import { NestFactory } from '@nestjs/core';
import { IndexerModule } from './indexer.module';

async function bootstrap() {
  const app = await NestFactory.create(IndexerModule);
  await app.listen(3000);
}
bootstrap();
