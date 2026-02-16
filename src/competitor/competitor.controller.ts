// competitor.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CompetitorService } from './competitor.service';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { UpdateCompetitorDto } from './dto/update-competitor.dto';
import { CompetitorStatus } from './entities/competitor.entity';

@Controller('competitors') // 👈 plural
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  @Post()
  create(@Body() createDto: CreateCompetitorDto) {
    return this.competitorService.create(createDto);
  }

  @Get()
  findAll() {
    return this.competitorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCompetitorDto,
  ) {
    return this.competitorService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.competitorService.remove(id);
  }

  // 🔹 cambio de estado (lo que dispara el botón "Aprobar / Suspender")
  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body('status') status: CompetitorStatus,
  ) {
    return this.competitorService.changeStatus(id, status);
  }

  // 🔹 robots del competidor (para el modal)
  @Get(':id/robots')
  getRobots(@Param('id') id: string) {
    return this.competitorService.findRobotsByCompetitor(id);
  }
}
