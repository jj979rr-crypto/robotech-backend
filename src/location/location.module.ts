// src/location/location.module.ts
import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Tournament } from '../tournament/entities/tournament.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Tournament])
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
