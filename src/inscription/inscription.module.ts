import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscription } from './entities/inscription.entity';
import { InscriptionService } from './inscription.service';
import { InscriptionController } from './inscription.controller';
import { Robot } from '../robot/entities/robot.entity';
import { Tournament } from '../tournament/entities/tournament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inscription, Robot, Tournament])],
  controllers: [InscriptionController],
  providers: [InscriptionService],
})
export class InscriptionModule {}
