import { IsString, Min, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateLocationDto {
  @IsString()
  nombre: string;

  @IsString()
  direccion: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  capacidad: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  disponible?: boolean;
}
