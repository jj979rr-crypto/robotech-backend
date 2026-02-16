// src/tournament/tournament.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tournament, TournamentStatus } from './entities/tournament.entity';
import { Repository } from 'typeorm';
import { Location } from '../location/entities/location.entity';
import { Inscription } from '../inscription/entities/inscription.entity';
// ✅ CORRECCIÓN: Usamos '../' igual que Location e Inscription
import { Category } from '../categories/entities/category.entity';
import { Robot, RobotStatus } from '../robot/entities/robot.entity'; 

// --- Tipos auxiliares para el fixture/bracket ---
interface BracketSide {
  inscriptionId: string;
  robotName: string;
  nickname: string;
  club: string;
}

interface BracketMatch {
  matchNumber: number;
  round: number;
  a: BracketSide | null;
  b: BracketSide | null;
}

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,

    @InjectRepository(Location)
    private locationRepository: Repository<Location>,

    @InjectRepository(Inscription)
    private inscriptionRepository: Repository<Inscription>,

    // ✅ INYECCIÓN NUEVA: Repositorio de Categorías
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    @InjectRepository(Robot)
    private robotRepository: Repository<Robot>,
  ) {}


  async create(createTournamentDto: CreateTournamentDto) {
    // 1. Validar Sede
    let location: Location | undefined = undefined;
    if (createTournamentDto.locationId) {
      const foundLocation = await this.locationRepository.findOneBy({
        id: createTournamentDto.locationId,
      });

      if (!foundLocation) {
        throw new NotFoundException(
          `La sede con ID ${createTournamentDto.locationId} no existe`,
        );
      }
      location = foundLocation;
    }

    // ✅ 2. Validar Categoría (NUEVO)
    let category: Category | undefined = undefined;
    if (createTournamentDto.categoryId) {
      const foundCategory = await this.categoryRepository.findOneBy({
        id: createTournamentDto.categoryId,
      });

      if (!foundCategory) {
        throw new NotFoundException(
          `La categoría con ID ${createTournamentDto.categoryId} no existe`,
        );
      }
      category = foundCategory;
    }

    const {
      minParticipantes,
      maxParticipantes,
      inscripcionCierra,
      esPublico,
      fechaInicio,
      fechaFin,
      categoryId, // Extraemos para no pasarlo directo al create
      locationId, // Extraemos para no pasarlo directo al create
      ...rest
    } = createTournamentDto;

    // 3. Convertir fechas
    const fechaInicioDate = new Date(fechaInicio);
    if (isNaN(fechaInicioDate.getTime())) {
      throw new BadRequestException('fechaInicio inválida.');
    }

    const fechaFinDate =
      fechaFin && fechaFin !== ''
        ? new Date(fechaFin)
        : null;

    if (fechaFinDate && isNaN(fechaFinDate.getTime())) {
      throw new BadRequestException('fechaFin inválida.');
    }

    // 4. Validar disponibilidad de sede
    if (location) {
      await this.validateLocationAvailability(
        location.id,
        fechaInicioDate,
        fechaFinDate,
      );
    }

    // 5. Crear Torneo con relaciones
    const torneo = this.tournamentRepository.create({
      ...rest,
      fechaInicio: fechaInicioDate,
      fechaFin: fechaFinDate,
      minParticipantes: minParticipantes ?? 8,
      maxParticipantes: maxParticipantes ?? 16,
      inscripcionCierra: inscripcionCierra
        ? new Date(inscripcionCierra)
        : null,
      esPublico: esPublico ?? false,
      location,
      category, // ✅ Asignamos la relación
    });

    return this.tournamentRepository.save(torneo);
  }

  //  FINALIZAR TORNEO Y LIBERAR ROBOTS
  async finishTournament(id: string) {
    // 1. Buscar el torneo con sus inscripciones y robots
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['inscriptions', 'inscriptions.robot'], // Traemos los robots asociados
    });

    if (!tournament) {
      throw new NotFoundException(`Torneo con ID ${id} no encontrado`);
    }

    if (tournament.estado === TournamentStatus.FINISHED) {
      throw new BadRequestException('El torneo ya ha sido finalizado previamente');
    }

    // 2. Cambiar estado del torneo
    tournament.estado = TournamentStatus.FINISHED;
    // Opcional: Cerrar inscripciones por seguridad
    tournament.esPublico = false; 

    // 3. Iterar sobre los inscritos y actualizar sus robots
    const robotUpdates: Promise<any>[] = [];

    if (tournament.inscriptions && tournament.inscriptions.length > 0) {
      for (const inscription of tournament.inscriptions) {
        const robot = inscription.robot;

        // Solo actualizamos si el robot existe y está en estado de competición
        // Ajusta 'COMPETING' al valor exacto de tu Enum
        if (robot && robot.status === RobotStatus.COMPETING) { 
          robot.status = RobotStatus.MAINTENANCE; // 👈 Aquí ocurre la magia
          robotUpdates.push(this.robotRepository.save(robot));
        }
      }
    }

    // 4. Guardar todo (Torneo y Robots)
    await this.tournamentRepository.save(tournament);
    
    // Ejecutamos todas las actualizaciones de robots en paralelo para mayor velocidad
    await Promise.all(robotUpdates);

    return { 
      message: `Torneo finalizado. ${robotUpdates.length} robots enviados a mantenimiento.`,
      tournament 
    };
  }

  findAll() {
    return this.tournamentRepository.find({
      order: { fechaInicio: 'ASC' },
      relations: ['location', 'category'], // ✅ Traemos la categoría
    });
  }

  async findOne(id: string) {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['location', 'category'], // ✅ Traemos la categoría
    });

    if (!tournament)
      throw new NotFoundException(`Torneo con ID ${id} no encontrado`);

    return tournament;
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto) {
    const existing = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['location', 'category'],
    });

    if (!existing) {
      throw new NotFoundException(`Torneo con ID ${id} no encontrado`);
    }

    // 1. Actualizar Sede
    let location = existing.location;
    if (updateTournamentDto.locationId) {
      const newLocation = await this.locationRepository.findOneBy({
        id: updateTournamentDto.locationId,
      });
      if (!newLocation) {
        throw new NotFoundException(
          `La sede con ID ${updateTournamentDto.locationId} no existe`,
        );
      }
      location = newLocation;
    }

    // ✅ 2. Actualizar Categoría (NUEVO)
    let category = existing.category;
    if (updateTournamentDto.categoryId) {
      const newCategory = await this.categoryRepository.findOneBy({
        id: updateTournamentDto.categoryId,
      });
      if (!newCategory) {
        throw new NotFoundException(
          `La categoría con ID ${updateTournamentDto.categoryId} no existe`,
        );
      }
      category = newCategory;
    }

    // 3. Actualizar Fechas
    const fechaInicio =
      updateTournamentDto.fechaInicio
        ? new Date(updateTournamentDto.fechaInicio)
        : existing.fechaInicio;

    const fechaFin =
      updateTournamentDto.fechaFin !== undefined
        ? (updateTournamentDto.fechaFin
          ? new Date(updateTournamentDto.fechaFin)
          : null)
        : existing.fechaFin;

    if (isNaN(fechaInicio.getTime())) {
      throw new BadRequestException('fechaInicio inválida.');
    }
    if (fechaFin && isNaN(fechaFin.getTime())) {
      throw new BadRequestException('fechaFin inválida.');
    }

    // 4. Validar disponibilidad
    if (location && (updateTournamentDto.locationId || updateTournamentDto.fechaInicio || updateTournamentDto.fechaFin)) {
      // Solo validamos si cambia la sede o las fechas
       await this.validateLocationAvailability(location.id, fechaInicio, fechaFin, id);
    }

    // 5. Guardar cambios
    const torneo = await this.tournamentRepository.preload({
      id,
      ...updateTournamentDto,
      fechaInicio,
      fechaFin,
      location,
      category, // Actualizamos relación
    });

    if (!torneo) {
      throw new NotFoundException(`Torneo con ID ${id} no encontrado`);
    }

    return this.tournamentRepository.save(torneo);
  }

  async remove(id: string) {
    const tournament = await this.findOne(id);
    return this.tournamentRepository.remove(tournament);
  }

  // ======================================================
  //  FIXTURE / BRACKET DEL TORNEO
  // ======================================================
  async getBracketForTournament(tournamentId: string) {
    const torneo = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: [
        'inscriptions',
        'inscriptions.robot',
        'inscriptions.robot.competitor',
        'inscriptions.robot.competitor.club',
        'location',
        'category', // ✅ Traemos categoría
      ],
    });

    if (!torneo) {
      throw new NotFoundException(`Torneo con ID ${tournamentId} no encontrado`);
    }

    const inscriptions = torneo.inscriptions ?? [];

    // Mezclamos aleatoriamente (Fisher–Yates)
    const shuffled = [...inscriptions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Mapeamos a los datos que necesita el front
    const participants: BracketSide[] = shuffled.map((ins) => {
      const robot = ins.robot;
      const competitor = robot?.competitor;
      const club = competitor?.club;

      return {
        inscriptionId: ins.id,
        robotName: robot?.nombre ?? 'Robot',
        nickname: competitor?.nickname ?? 'Competidor',
        club: club?.nombre ?? 'Club',
      };
    });

    // Armamos los matches de a 2
    const matches: BracketMatch[] = [];
    for (let i = 0; i < participants.length; i += 2) {
      matches.push({
        matchNumber: i / 2 + 1,
        round: 1,
        a: participants[i] ?? null,
        b: participants[i + 1] ?? null,
      });
    }

    return {
      tournamentId: torneo.id,
      nombre: torneo.nombre,
      // ✅ CAMBIO: Devolvemos el objeto categoría completo
      category: torneo.category, 
      sede: torneo.location ? torneo.location.nombre : null,
      totalParticipants: participants.length,
      matches,
    };
  }

  async generateFixture(tournamentId: string) {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['category'], // ✅ Necesitamos la categoría
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    // Traer inscripciones con toda la info necesaria
    const inscripciones = await this.inscriptionRepository.find({
      where: { tournament: { id: tournament.id } },
      relations: ['robot', 'robot.competitor', 'robot.competitor.club'],
      order: { fechaInscripcion: 'ASC' },
    });

    if (inscripciones.length < tournament.minParticipantes) {
      throw new BadRequestException(
        `El torneo requiere mínimo ${tournament.minParticipantes} participantes para generar el fixture`,
      );
    }

    if (inscripciones.length > tournament.maxParticipantes) {
      throw new BadRequestException(
        `Hay más inscritos (${inscripciones.length}) que el máximo permitido (${tournament.maxParticipantes})`,
      );
    }

    // --- 1. Determinar tamaño del bracket (8 o 16) ---
    const n = inscripciones.length;
    const bracketSize = n <= 8 ? 8 : 16;

    // --- 2. Mezclar aleatoriamente los inscritos ---
    const pool = [...inscripciones];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // --- 3. Rellenar con BYEs si faltan slots ---
    const poolWithByes = [...pool];
    while (poolWithByes.length < bracketSize) {
      poolWithByes.push(null as any); // Slot vacío (bye)
    }

    type MatchSlot = {
      inscriptionId: string;
      robotName: string;
      nickname: string;
      club: string;
    };

    type Match = {
      matchNumber: number;
      round: number;
      a: MatchSlot | null;
      b: MatchSlot | null;
    };

    const matches: Match[] = [];

    // --- 4. Agrupar de 2 en 2 ---
    for (let i = 0; i < bracketSize; i += 2) {
      const slotA = poolWithByes[i];
      const slotB = poolWithByes[i + 1];

      matches.push({
        matchNumber: i / 2 + 1,
        round: 1,
        a: slotA
          ? {
              inscriptionId: slotA.id,
              robotName: slotA.robot.nombre,
              nickname: slotA.robot.competitor.nickname,
              club: slotA.robot.competitor.club.nombre,
            }
          : null,
        b: slotB
          ? {
              inscriptionId: slotB.id,
              robotName: slotB.robot.nombre,
              nickname: slotB.robot.competitor.nickname,
              club: slotB.robot.competitor.club.nombre,
            }
          : null,
      });
    }

    // --- 5. Respuesta estructurada para el frontend ---
    return {
      tournament: {
        id: tournament.id,
        nombre: tournament.nombre,
        // ✅ CAMBIO: Objeto categoría
        category: tournament.category, 
        fechaInicio: tournament.fechaInicio,
        fechaFin: tournament.fechaFin,
        maxParticipantes: tournament.maxParticipantes,
        minParticipantes: tournament.minParticipantes,
      },
      totalInscritos: inscripciones.length,
      bracketSize,
      matches,
    };
  }

  // 🔹 Torneos públicos para la web
  findPublic() {
    return this.tournamentRepository.find({
      where: [
        {
          estado: TournamentStatus.OPEN,
          esPublico: true,
        },
        {
          estado: TournamentStatus.IN_PROGRESS,
          esPublico: true,
        },
      ],
      relations: ['location', 'category'], // ✅ Incluimos categoría
      order: { fechaInicio: 'ASC' },
    });
  }

  // 🔹 Publicar torneo
  async openInscription(id: string) {
    const tournament = await this.findOne(id);

    if (tournament.estado !== TournamentStatus.OPEN) {
      throw new BadRequestException(
        'Solo torneos en estado "Abierto" pueden publicar inscripciones',
      );
    }

    tournament.esPublico = true;
    return this.tournamentRepository.save(tournament);
  }

  // 🔹 Cerrar inscripciones
  async closeInscription(id: string) {
    const tournament = await this.findOne(id);

    if (!tournament.esPublico) {
      throw new BadRequestException('El torneo no está publicado');
    }

    tournament.esPublico = false;
    return this.tournamentRepository.save(tournament);
  }

  private async validateLocationAvailability(
    locationId: string,
    fechaInicio: Date,
    fechaFin: Date | null,
    excludeTournamentId?: string,
  ) {
    const bufferDays = 2;

    const startWithBuffer = new Date(fechaInicio);
    startWithBuffer.setDate(startWithBuffer.getDate() - bufferDays);

    const effectiveEnd = fechaFin ?? fechaInicio;
    const endWithBuffer = new Date(effectiveEnd);
    endWithBuffer.setDate(endWithBuffer.getDate() + bufferDays);

    const qb = this.tournamentRepository
      .createQueryBuilder('t')
      .leftJoin('t.location', 'loc')
      .where('loc.id = :locationId', { locationId })
      .andWhere('t.fechaInicio <= :endWithBuffer', { endWithBuffer })
      .andWhere('COALESCE(t.fechaFin, t.fechaInicio) >= :startWithBuffer', { startWithBuffer });

    if (excludeTournamentId) qb.andWhere('t.id <> :excludeTournamentId', { excludeTournamentId });

    const overlapping = await qb.getOne();

    if (overlapping) {
      throw new BadRequestException(
        'La sede ya está ocupada en fechas cercanas. Elige otra fecha o sede.',
      );
    }
  }

}