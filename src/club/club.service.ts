// src/club/club.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // 👈 1. AGREGAR DataSource AQUÍ
import { Club, ClubStatus } from './entities/club.entity';
import { Competitor } from '../competitor/entities/competitor.entity';
// Asegúrate de que la ruta a tu entidad Tournament sea correcta:
import { Tournament } from '../tournament/entities/tournament.entity'; // 👈 2. IMPORTAR TORNEO

import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,

    @InjectRepository(Competitor)
    private readonly competitorRepository: Repository<Competitor>,

    // 👈 3. INYECTAR DATASOURCE (Necesario para consultas complejas)
    private readonly dataSource: DataSource, 
  ) {}

  create(createClubDto: CreateClubDto) {
    return 'This action adds a new club';
  }

  // --- 1. LISTAR TODOS ---
  async findAll() {
    return this.clubRepository.find({
      order: { nombre: 'ASC' },
      relations: ['owner'],
    });
  }

  // --- 2. BUSCAR UNO ---
  async findOne(id: string) {
    const club = await this.clubRepository.findOne({ where: { id } });
    if (!club) throw new NotFoundException(`Club con ID ${id} no encontrado`);
    return club;
  }

  // --- 3. ACTUALIZAR DATOS ---
  async update(id: string, updateClubDto: UpdateClubDto) {
    const club = await this.findOne(id);
    this.clubRepository.merge(club, updateClubDto);
    return this.clubRepository.save(club);
  }

  // --- 4. ACTUALIZAR ESTADO ---
  async updateStatus(id: string, status: ClubStatus) {
    const club = await this.findOne(id);
    club.status = status;

    if (status === ClubStatus.APPROVED && !club.codigoInvitacion) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const namePart = club.nombre
        .substring(0, 3)
        .toUpperCase()
        .replace(/\s/g, '');

      club.codigoInvitacion = `${namePart}-${randomPart}-2025`;
    }

    return this.clubRepository.save(club);
  }

  // --- 5. POLLING DE ESTADO ---
  async getStatus(id: string) {
    const club = await this.clubRepository.findOne({
      where: { id },
      select: ['status', 'codigoInvitacion', 'descripcion', 'direccion'],
    });
    if (!club) throw new NotFoundException('Club no encontrado');
    return club;
  }

  // --- 6. COMPETIDORES DEL CLUB ---
  async getCompetitors(id: string) {
    const club = await this.clubRepository.findOne({
      where: { id },
      relations: ['competitors', 'competitors.user'],
    });

    if (!club) throw new NotFoundException('Club no encontrado');
    return club.competitors || [];
  }

  async findCompetitors(clubId: string) {
    return this.competitorRepository.find({
      where: { club: { id: clubId } },
      relations: ['user'],
      order: { nombres: 'ASC' },
    });
  }

  // --- 7. ELIMINAR ---
  async remove(id: string) {
    const club = await this.clubRepository.findOne({
      where: { id },
      relations: ['competitors'],
    });

    if (!club) throw new NotFoundException('Club no encontrado');

    if (club.competitors && club.competitors.length > 0) {
      throw new ConflictException(
        'No puedes eliminar un club que tiene competidores registrados.',
      );
    }

    await this.clubRepository.remove(club);
    return { message: 'Club eliminado correctamente.' };
  }

  // ==========================================================
  // 🆕 8. BUSCAR TORNEOS Y CONTAR INSCRIPCIONES (CORREGIDO)
  // ==========================================================
  async findTournamentsByClub(clubId: string) {
    const tournaments = await this.dataSource
      .getRepository(Tournament)
      .createQueryBuilder('tournament')
      // 1. Usamos innerJoinAndSelect para TRAER los datos, no solo filtrar
      .innerJoinAndSelect('tournament.inscriptions', 'inscription') 
      .innerJoinAndSelect('inscription.robot', 'robot')
      .innerJoinAndSelect('robot.competitor', 'competitor')
      .innerJoinAndSelect('competitor.club', 'club') // Traemos el club para asegurar la comparación
      // 2. Filtramos solo donde participa este club
      .where('club.id = :clubId', { clubId })
      .getMany();

    // 3. Mapeamos para agregar la propiedad 'inscripcionesCount' que espera el Frontend
    return tournaments.map((t) => {
      // Contamos manualmente cuántas inscripciones en este torneo son de ESTE club
      const inscripcionesDelClub = t.inscriptions.filter((i) => {
        // Verificamos si el robot tiene competidor y si el club coincide
        return i.robot?.competitor?.club?.id === clubId;
      });

      return {
        ...t,
        // Si por alguna razón el filtro falla, devolvemos el total, pero lo ideal es el filtrado
        inscripcionesCount: inscripcionesDelClub.length 
      };
    });
  }
}