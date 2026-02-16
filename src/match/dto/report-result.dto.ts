// src/match/dto/report-result.dto.ts
import { IsEnum } from 'class-validator';
import { MatchResult } from '../entities/match.entity';

export class ReportResultDto {
  @IsEnum(MatchResult, { message: 'Resultado de combate inválido' })
  result: MatchResult;
}
