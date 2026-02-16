import { IsString, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, StaffType } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  // Estos campos eran los que daban error porque faltaba validarlos/permitirlos
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol inválido' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(StaffType, { message: 'Tipo de staff inválido' })
  staffType?: StaffType;
}