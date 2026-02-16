import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { CreateClubIncidentDto } from './dto/create-club-incident.dto';
import { CreateMatchIncidentDto } from './dto/create-match-incident.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('behavior')
export class BehaviorController {
  constructor(private readonly behaviorService: BehaviorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('competitors/:id/club')
  createClubIncident(
    @Param('id') competitorId: string,
    @Body() dto: CreateClubIncidentDto,
    @Req() req: any,
  ) {
    const actorUserId = req.user.id; //aquí es id
    return this.behaviorService.createClubIncident(competitorId, dto, actorUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId')
  createMatchIncident(
    @Param('matchId') matchId: string,
    @Body() dto: CreateMatchIncidentDto,
    @Req() req: any,
  ) {
    const actorUserId = req.user.id; //aquí es id
    return this.behaviorService.createMatchIncident(matchId, dto, actorUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('competitors/:id')
  listByCompetitor(@Param('id') competitorId: string, @Req() req: any) {
    const actorUserId = req.user.id; //aquí es id
    return this.behaviorService.listByCompetitor(competitorId, actorUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('events/:id/resolve')
  resolveEvent(@Param('id') eventId: string, @Req() req: any) {
    const actorUserId = req.user.id;
    return this.behaviorService.resolveEvent(eventId, actorUserId);
  }
  
}
