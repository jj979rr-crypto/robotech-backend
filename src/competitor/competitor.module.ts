// competitor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorService } from './competitor.service';
import { CompetitorController } from './competitor.controller';
import { Competitor } from './entities/competitor.entity';
import { Robot } from '../robot/entities/robot.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Competitor, Robot, User])],
  controllers: [CompetitorController],
  providers: [CompetitorService],
  exports: [CompetitorService],
})
export class CompetitorModule {}
