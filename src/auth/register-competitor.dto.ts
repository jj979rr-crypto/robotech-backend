// src/auth/register-competitor.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  Matches,
  IsDateString,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { IsSafeNickname } from '../competitor/validators/is-safe-nickname.validator';

export class RegisterCompetitorDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'La contraseña es muy débil: requiere mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @IsString()
  @Length(8, 8, { message: 'El DNI debe tener 8 caracteres' })
  @Matches(/^[0-9]+$/, { message: 'El DNI solo debe contener números' })
  dni: string;

  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)' },
  )
  fechaNacimiento: string;

  @IsString()
  @Length(3, 20, {
    message: 'El nickname debe tener entre 3 y 20 caracteres',
  })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'El nickname solo puede contener letras, números, guiones y guion bajo',
  })
  @IsSafeNickname({
    message: 'El nickname contiene términos ofensivos o inapropiados. Elige otro.',
  })
  nickname: string;

  @IsString()
  @IsNotEmpty({ message: 'El código de invitación es obligatorio' })
  codigoInvitacion: string;
}
