import { Controller, Get, Query } from '@nestjs/common';

import { SearchService } from './search.service';

/** Réplica fiel de SearchController (CI4). GET /api/search?q=&limit=. */
@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get()
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.svc.search(q, limit);
  }
}
