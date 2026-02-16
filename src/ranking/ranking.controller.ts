import { Controller, Get, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('competitors')
  getCompetitors(
    @Query('year') year?: string,
    @Query('semester') semester?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const y = year ? Number(year) : undefined;
    const s = semester ? (Number(semester) as 1 | 2) : undefined;

    return this.rankingService.getCompetitorRanking({
      year: Number.isNaN(y) ? undefined : y,
      semester: Number.isNaN(s as number) ? undefined : s,
      categoryId: categoryId || undefined,
    });
  }

  @Get('clubs')
  getClubs(
    @Query('year') year?: string,
    @Query('semester') semester?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const y = year ? Number(year) : undefined;
    const s = semester ? (Number(semester) as 1 | 2) : undefined;

    return this.rankingService.getClubRanking({
      year: Number.isNaN(y) ? undefined : y,
      semester: Number.isNaN(s as number) ? undefined : s,
      categoryId: categoryId || undefined,
    });
  }

  @Get('categories')
  getCategories(
    @Query('year') year?: string,
    @Query('semester') semester?: string,
  ) {
    const y = year ? Number(year) : undefined;
    const s = semester ? (Number(semester) as 1 | 2) : undefined;

    return this.rankingService.getCategoryRanking({
      year: Number.isNaN(y) ? undefined : y,
      semester: Number.isNaN(s as number) ? undefined : s,
    });
  }
}
