import { IsString, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { RobotCategory, RobotStatus } from '../entities/robot.entity';

export class CreateRobotDto {
  @IsString()
  nombre: string;

  @IsEnum(RobotCategory, { message: 'Categoría inválida' })
  categoria: RobotCategory;

  @IsNumber({}, { message: 'El peso debe ser un número' })
  peso: number;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  // ✅ NUEVO: opcional, por defecto se pone en la entidad
  @IsOptional()
  @IsEnum(RobotStatus, { message: 'Estado inválido' })
  status?: RobotStatus;

  @IsUUID('4', { message: 'ID de competidor inválido' })
  competitorId: string;
}
