// src/match/match.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { ReportResultDto } from './dto/report-result.dto';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  // Crear una pelea de combate entre dos inscritos
  @Post('combat')
  createCombat(@Body() dto: CreateMatchDto) {
    return this.matchService.createCombatMatch(dto);
  }

  // Reportar resultado de una pelea de combate (3–1–0)
  @Patch('combat/:id/result')
  reportCombatResult(@Param('id') id: string, @Body() body: ReportResultDto) {
    return this.matchService.reportCombatResult(id, body.result);
  }

  // Ver todas las peleas de un torneo
  @Get('tournament/:id')
  listByTournament(@Param('id') tournamentId: string) {
    return this.matchService.generateFixture(tournamentId);
  }
}
