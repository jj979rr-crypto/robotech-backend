// src/competitor/competitor.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { UpdateCompetitorDto } from './dto/update-competitor.dto';
import { Competitor, CompetitorStatus } from './entities/competitor.entity';
import { Robot } from '../robot/entities/robot.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CompetitorService {
  constructor(
    @InjectRepository(Competitor)
    private readonly competitorRepo: Repository<Competitor>,
    @InjectRepository(Robot)
    private readonly robotRepo: Repository<Robot>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateCompetitorDto) {
    const nicknameNormalized = createDto.nickname.trim().toLowerCase();

    const existing = await this.competitorRepo.findOne({
      where: { nickname: nicknameNormalized },
      select: ['id'],
    });

    if (existing) {
      throw new ConflictException('El nickname ya está en uso');
    }

    const competitor = this.competitorRepo.create({
      nombres: createDto.nombres,
      apellidos: createDto.apellidos,
      dni: createDto.dni,
      nickname: nicknameNormalized, // ✅ una sola vez
      fotoUrl: createDto.fotoUrl,
    });

    try {
      return await this.competitorRepo.save(competitor);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.code === '23505') {
        throw new ConflictException('El nickname ya está en uso');
      }
      throw error;
    }
  }


  findAll() {
    return this.competitorRepo.find({
      relations: ['club', 'user'],
      order: { nombres: 'ASC' },
    });
  }

  async findOne(id: string) {
    const competitor = await this.competitorRepo.findOne({
      where: { id },
      relations: ['club', 'user'],
    });
    if (!competitor) throw new NotFoundException('Competidor no encontrado');
    return competitor;
  }

  async update(id: string, updateDto: UpdateCompetitorDto) {
    const competitor = await this.findOne(id);

    // Si viene nickname nuevo, validamos que no choque con otro
    if (updateDto.nickname && updateDto.nickname !== competitor.nickname) {
      const existing = await this.competitorRepo.findOne({
        where: { nickname: updateDto.nickname },
        select: ['id'],
      });
      if (existing) {
        throw new ConflictException('El nickname ya está en uso');
      }
    }

    Object.assign(competitor, updateDto);

    try {
      return await this.competitorRepo.save(competitor);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.code === '23505') {
        throw new ConflictException('El nickname ya está en uso');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const competitor = await this.competitorRepo.findOne({
      where: { id },
      relations: ['robots'],
    });

    if (!competitor) {
      throw new NotFoundException('Competidor no encontrado');
    }

    if (competitor.robots && competitor.robots.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un competidor con robots registrados. Inhabilítalo en su lugar.',
      );
    }

    return this.competitorRepo.remove(competitor);
  }

  async changeStatus(id: string, status: CompetitorStatus) {
    const competitor = await this.findOne(id);
    competitor.status = status;

    if (competitor.user) {
      competitor.user.isActive = status === CompetitorStatus.APPROVED;
      await this.userRepo.save(competitor.user);
    }

    return this.competitorRepo.save(competitor);
  }

  async findRobotsByCompetitor(competitorId: string) {
    const competitor = await this.competitorRepo.findOne({
      where: { id: competitorId },
    });
    if (!competitor) throw new NotFoundException('Competidor no encontrado');

    return this.robotRepo.find({
      where: { competitor: { id: competitorId } },
      relations: ['competitor', 'competitor.club'],
      order: { nombre: 'ASC' },
    });
  }
}
