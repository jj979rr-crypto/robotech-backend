import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRobotDto } from './dto/create-robot.dto';
import { UpdateRobotDto } from './dto/update-robot.dto';
import { Robot } from './entities/robot.entity';
import { Competitor } from '../competitor/entities/competitor.entity';

@Injectable()
export class RobotService {
  constructor(
    @InjectRepository(Robot)
    private robotRepository: Repository<Robot>,
    @InjectRepository(Competitor)
    private competitorRepository: Repository<Competitor>,
  ) {}

  async create(createRobotDto: CreateRobotDto) {
    const competitor = await this.competitorRepository.findOneBy({
      id: createRobotDto.competitorId,
    });

    if (!competitor) {
      throw new NotFoundException('El competidor no existe');
    }

    const robot = this.robotRepository.create({
      ...createRobotDto,
      competitor,
    });

    return this.robotRepository.save(robot);
  }

  findAll() {
    return this.robotRepository.find({ relations: ['competitor'] });
  }

  async findByCompetitor(competitorId: string) {
    return this.robotRepository.find({
      where: { competitor: { id: competitorId } },
    });
  }

  findOne(id: string) {
    return this.robotRepository.findOne({
      where: { id },
      relations: ['competitor'],
    });
  }

  // ✅ NUEVO: update real
  async update(id: string, updateRobotDto: UpdateRobotDto) {
    const robot = await this.robotRepository.preload({
      id,
      ...updateRobotDto,
    });

    if (!robot) {
      throw new NotFoundException('Robot no encontrado');
    }

    return this.robotRepository.save(robot);
  }

  // ✅ NUEVO: delete real
  async remove(id: string) {
    const robot = await this.robotRepository.findOne({ where: { id } });

    if (!robot) {
      throw new NotFoundException('Robot no encontrado');
    }

    return this.robotRepository.remove(robot);
  }
}
