import { IsUUID } from 'class-validator';

export class CreateInscriptionDto {
  @IsUUID('4', { message: 'ID de robot inválido' })
  robotId: string;

  @IsUUID('4', { message: 'ID de torneo inválido' })
  tournamentId: string;
}

