// src/competitor/dto/create-competitor.dto.ts
import {
  IsString,
  Length,
  Matches,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { IsSafeNickname } from '../validators/is-safe-nickname.validator';


export class CreateCompetitorDto {
  @IsString()
  @Length(2, 50, { message: 'Los nombres deben tener entre 2 y 50 caracteres' })
  nombres: string;

  @IsString()
  @Length(2, 50, { message: 'Los apellidos deben tener entre 2 y 50 caracteres' })
  apellidos: string;

  @IsString()
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 caracteres' })
  dni: string;

  @IsString()
  @Length(3, 20, { message: 'El nickname debe tener entre 3 y 20 caracteres' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'El nickname solo puede contener letras, números, guiones y guion bajo',
  })
  @IsSafeNickname()
  nickname: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  // Depende de cómo estés creando el competidor:
  // si lo creas asociado a un usuario y club ya existentes:
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  clubId?: string;
}
