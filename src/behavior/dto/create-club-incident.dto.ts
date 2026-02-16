import { IsEnum, IsInt, IsString, Max, Min, Length } from 'class-validator';
import { BehaviorCategory } from '../entities/behavior-event.entity';

export class CreateClubIncidentDto {
  @IsEnum(BehaviorCategory)
  category: BehaviorCategory;

  @IsString()
  @Length(2, 40)
  type: string;

  @IsInt()
  @Min(1)
  @Max(5)
  severity: number;

  @IsString()
  @Length(5, 1000)
  description: string;
}
