import { Module } from '@nestjs/common';
import { RobotService } from './robot.service';
import { RobotController } from './robot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Robot } from './entities/robot.entity';
import { Competitor } from '../competitor/entities/competitor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Robot, Competitor]) 
  ],
  controllers: [RobotController],
  providers: [RobotService],
})
export class RobotModule {}