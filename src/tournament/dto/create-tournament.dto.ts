import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  Validate
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsNotEqualTournamentLocationValidator} from '../validators/is-not-equal-name.validator';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @Validate(IsNotEqualTournamentLocationValidator)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsInt()
  categoryId: number;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  // 🔹 Mínimo de participantes (ajustado con Type para transformar strings si vienen del form)
  @IsOptional()
  @IsInt()
  @Min(2) // He bajado el mínimo a 2 por si acaso (8 es estricto para pruebas), pero puedes dejarlo en 8
  @Type(() => Number)
  minParticipantes?: number;

  // 🔹 Máximo de participantes
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(64) // He subido el máximo a 64 (16 es poco para brackets grandes), ajusta según tu regla de negocio
  @Type(() => Number)
  maxParticipantes?: number;

  // 🔹 Límite de inscripciones
  @IsOptional()
  @IsDateString()
  inscripcionCierra?: string;

  // 🔹 Si se publica en la web o no
  @IsOptional()
  @IsBoolean()
  esPublico?: boolean;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  // Para permitir pasar el objeto completo si fuera necesario (aunque locationId es lo usual)
  @IsOptional()
  location?: any;

  @IsOptional()
  @IsString()
  locationId?: string;

}