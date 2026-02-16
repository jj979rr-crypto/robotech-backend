import { PartialType } from '@nestjs/mapped-types';
import { CreateReniecDto } from './create-reniec.dto';

export class UpdateReniecDto extends PartialType(CreateReniecDto) {}
