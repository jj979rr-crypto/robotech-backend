// src/competitor/dto/update-competitor.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitorDto } from './create-competitor.dto';

export class UpdateCompetitorDto extends PartialType(CreateCompetitorDto) {}
