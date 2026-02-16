import {IsEmail,IsNotEmpty,IsString,MinLength,MaxLength,Matches,IsDateString,
} from 'class-validator';

export class RegisterClubDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'La contraseña es muy débil: requiere mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del club es obligatorio' })
  nombreClub: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  // --- DATOS DEL REPRESENTANTE ---

  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @MinLength(8, { message: 'El DNI debe tener 8 caracteres' })
  @MaxLength(8, { message: 'El DNI debe tener 8 caracteres' })
  dni: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)' })
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;
}
