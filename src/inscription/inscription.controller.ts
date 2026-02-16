import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';

@Controller('inscription')
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}

  // Registrar un robot en un torneo
  @Post()
  create(@Body() createInscriptionDto: CreateInscriptionDto) {
    return this.inscriptionService.create(createInscriptionDto);
  }

  // Ver todas las inscripciones (Admin)
  @Get()
  findAll() {
    return this.inscriptionService.findAll();
  }
  
  // Ver inscritos de un torneo específico (Para la lista del Juez)
  @Get('tournament/:id')
  findByTournament(@Param('id') id: string) {
      return this.inscriptionService.findByTournament(id);
  }

  // --- NUEVO ENDPOINT PARA EL JUEZ (CALIFICAR) ---
  @Patch(':id/judge')
  gradeRobot(
    @Param('id') id: string, 
    @Body() body: { score: number }
  ) {
    return this.inscriptionService.gradeRobot(id, body.score);
  }
}