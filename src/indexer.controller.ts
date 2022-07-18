import { Controller, Get } from '@nestjs/common';

@Controller()
export class IndexerController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
