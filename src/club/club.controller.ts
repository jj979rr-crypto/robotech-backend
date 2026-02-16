import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto'; 
import { UpdateClubDto } from './dto/update-club.dto'; 
import { ClubStatus } from './entities/club.entity';

@Controller('clubs')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  // Crear Club (Registro normal)
  @Post()
  create(@Body() createClubDto: CreateClubDto) {
    return this.clubService.create(createClubDto);
  }

  // Listar todos (Admin Dashboard)
  @Get()
  findAll() {
    return this.clubService.findAll();
  }

  // Obtener uno por ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubService.findOne(id);
  }
  // Obtener torneos de un club
  @Get(':id/tournaments')
  findTournaments(@Param('id') id: string) {
    return this.clubService.findTournamentsByClub(id);
  }

  // --- ENDPOINTS ESPECÍFICOS ---
  
  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.clubService.getStatus(id);
  }

  @Get(':id/competitors')
  getCompetitors(@Param('id') id: string) {
    return this.clubService.findCompetitors(id);
  }


  // --- EDICIÓN Y APROBACIÓN (PATCH) ---
  
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() body: any // Usamos 'any' para flexibilizar la entrada (status o datos)
  ) {
    // 1. Si el cuerpo trae 'status', es una Aprobación/Rechazo del Admin
    if (body.status) {
        return this.clubService.updateStatus(id, body.status as ClubStatus);
    }

    // 2. Si no, es una Edición de datos (Nombre, Dirección, etc.)
    return this.clubService.update(id, body as UpdateClubDto);
  }

  // --- ELIMINACIÓN (DELETE) ---
  
  @Delete(':id')
  remove(@Param('id') id: string) {
    // Ahora sí llama al servicio que borra de la BD
    return this.clubService.remove(id); 
  }
}