import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BehaviorController } from './behavior.controller';
import { BehaviorService } from './behavior.service';
import { BehaviorEvent } from './entities/behavior-event.entity';
import { Competitor } from '../competitor/entities/competitor.entity';
import { Club } from '../club/entities/club.entity';
import { User } from '../users/entities/user.entity';
import { Match } from '../match/entities/match.entity';
import { Inscription } from '../inscription/entities/inscription.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([BehaviorEvent, Competitor, Club, User, Match, Inscription]),
  ],
  controllers: [BehaviorController],
  providers: [BehaviorService],
})
export class BehaviorModule {}
