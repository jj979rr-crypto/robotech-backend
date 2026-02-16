// src/match/match.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { Tournament } from '../tournament/entities/tournament.entity';
import { Inscription } from '../inscription/entities/inscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Tournament, Inscription])],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
