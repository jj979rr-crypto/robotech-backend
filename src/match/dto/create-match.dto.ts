import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMatchDto {
  @IsUUID('4', { message: 'ID de torneo inválido' })
  tournamentId: string;

  @IsUUID('4', { message: 'ID de inscripción A inválido' })
  inscriptionAId: string;

  @IsUUID('4', { message: 'ID de inscripción B inválido' })
  inscriptionBId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  round?: number;
}
