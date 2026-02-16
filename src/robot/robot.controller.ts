import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RobotService } from './robot.service';
import { CreateRobotDto } from './dto/create-robot.dto';
import { UpdateRobotDto } from './dto/update-robot.dto';

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService) {}

  @Post()
  create(@Body() createRobotDto: CreateRobotDto) {
    return this.robotService.create(createRobotDto);
  }

  @Get()
  findAll() {
    return this.robotService.findAll();
  }

  @Get('my-robots/:competitorId')
  findByCompetitor(@Param('competitorId') competitorId: string) {
    return this.robotService.findByCompetitor(competitorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.robotService.findOne(id);
  }

  // ✅ update / delete usando string
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRobotDto: UpdateRobotDto) {
    return this.robotService.update(id, updateRobotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.robotService.remove(id);
  }
}
