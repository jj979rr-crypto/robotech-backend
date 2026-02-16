// src/ranking/ranking.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscription } from '../inscription/entities/inscription.entity';
import { Robot } from '../robot/entities/robot.entity';
import { Competitor } from '../competitor/entities/competitor.entity';
import { Club } from '../club/entities/club.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { Category } from '../categories/entities/category.entity';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscription,
      Robot,
      Competitor,
      Club,
      Tournament,
      Category,
    ]),
  ],
  providers: [RankingService],
  controllers: [RankingController],
})
export class RankingModule {}
