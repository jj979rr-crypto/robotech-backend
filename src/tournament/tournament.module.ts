import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { Tournament } from './entities/tournament.entity';
import { Location } from '../location/entities/location.entity';
import { Inscription } from '../inscription/entities/inscription.entity';
// ✅ Importamos la entidad Category
import { Category } from '../categories/entities/category.entity'; 
import { Robot } from 'src/robot/entities/robot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament, 
      Location, 
      Inscription,
      Category,
      Robot
    ]),
  ],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}