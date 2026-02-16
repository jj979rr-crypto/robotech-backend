import { IsString, IsOptional } from 'class-validator';

export class CreateClubDto {
  @IsString()
  nombre: string;

  @IsString()
  direccion: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
  
}