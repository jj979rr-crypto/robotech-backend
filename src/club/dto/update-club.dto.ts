import { PartialType } from '@nestjs/mapped-types';
import { CreateClubDto } from './create-club.dto';
import { IsEnum, IsOptional } from 'class-validator'; // <--- Importar validadores
import { ClubStatus } from '../entities/club.entity';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  
  @IsOptional()           // <--- Permitir que sea opcional (si solo actualizas nombre)
  @IsEnum(ClubStatus)     // <--- Validar que sea 'pending', 'approved' o 'rejected'
  status?: ClubStatus;
}