import { Controller, Get, Param } from '@nestjs/common';
import { ReniecService } from './reniec.service';

@Controller('reniec')
export class ReniecController {
  constructor(private readonly reniecService: ReniecService) {}

  @Get(':dni')
  consultar(@Param('dni') dni: string) {
    return this.reniecService.consultarDni(dni);
  }
}