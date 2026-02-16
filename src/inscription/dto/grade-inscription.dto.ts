// src/inscription/dto/grade-inscription.dto.ts
import { IsNumber, Min, Max } from 'class-validator';

export class GradeInscriptionDto {
  @IsNumber({}, { message: 'El puntaje debe ser numérico' })
  @Min(0, { message: 'El puntaje mínimo es 0' })
  @Max(100, { message: 'El puntaje máximo es 3' })
  score: number;
}
