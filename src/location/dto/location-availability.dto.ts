// src/location/dto/location-availability.dto.ts
import { IsDateString, IsOptional } from 'class-validator';

export class LocationAvailabilityQueryDto {
  @IsDateString()
  start: string;

  @IsOptional()
  @IsDateString()
  end?: string;
}
