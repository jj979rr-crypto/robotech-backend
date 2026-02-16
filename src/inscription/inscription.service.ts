import { Repository, Not } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Inscription, InscriptionStatus } from './entities/inscription.entity';
import { Robot } from '../robot/entities/robot.entity';
import {
  Tournament,
  TournamentStatus,
} from '../tournament/entities/tournament.entity';
import { ClubStatus } from '../club/entities/club.entity';
import { CompetitorStatus } from '../competitor/entities/competitor.entity';
import { GameType } from '../categories/entities/category.entity';

@Injectable()
export class InscriptionService {
  constructor(
    @InjectRepository(Inscription)
    private inscriptionRepo: Repository<Inscription>,
    @InjectRepository(Robot)
    private robotRepo: Repository<Robot>,
    @InjectRepository(Tournament)
    private tournamentRepo: Repository<Tournament>,
  ) {}

  // 🔹 Helper: normaliza y mapea a un código canónico
  private normalizeCategory(value?: string | null): string {
    if (!value) return '';

    const basic = (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')     // quita acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')        // solo letras/números/espacios
      .trim();

    // Mapa de ALIAS -> código interno
    const ALIAS_MAP: Record<string, string> = {
      // ========== SEGUIDOR DE LÍNEA ==========
      'seguidor de linea': 'seguidor-linea',
      'seguidor linea': 'seguidor-linea',

      // ========== SUMO 3KG ==========
      'sumo 3kg': 'sumo-3kg',
      'lucha de sumos': 'sumo-3kg',

      // ========== PESO HADA ==========
      'peso hada fairyweight': 'peso-hada',
      'peso hada': 'peso-hada',
      'combate cuerpo a cuerpo': 'peso-hada',

      // ========== PESO HORMIGA ==========
      'peso hormiga antweight': 'peso-hormiga',
      'peso hormiga': 'peso-hormiga',
      'combate ligero': 'peso-hormiga',        // si algún día usas este nombre

      // ========== PESO ESCARABAJO ==========
      'peso escarabajo beetleweight': 'peso-escarabajo',
      'peso escarabajo': 'peso-escarabajo',

      // ========== MINI SUMO ==========
      'mini sumo autonomo': 'mini-sumo',
      'mini sumo': 'mini-sumo',
    };

    return ALIAS_MAP[basic] || basic;
  }

    // 🔹 Clasifica un robot de combate según su peso (en gramos)
  private getCombatClassFromWeight(peso: number): 'hada' | 'hormiga' | 'escarabajo' | 'fuera_rango' {
    if (peso <= 150) return 'hada';        // Peso Hada
    if (peso <= 454) return 'hormiga';     // Peso Hormiga
    if (peso <= 1361) return 'escarabajo'; // Peso Escarabajo
    return 'fuera_rango';
  }

  // 🔹 Clasifica la categoría del torneo según el nombre de Category
  private getCombatClassFromCategoryName(name?: string | null): 'hada' | 'hormiga' | 'escarabajo' | 'desconocida' {
    if (!name) return 'desconocida';

    const t = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (t.includes('hada') || t.includes('fairy')) return 'hada';
    if (t.includes('hormiga') || t.includes('antweight')) return 'hormiga';
    if (t.includes('escarabajo') || t.includes('beetle')) return 'escarabajo';

    return 'desconocida';
  }


  // --- LÓGICA DE INSCRIPCIÓN (Validaciones) ---
  async create(dto: CreateInscriptionDto) {
    const ahora = new Date();

    // 1. Traer robot + competidor + club (+ user del competidor)
    const robot = await this.robotRepo.findOne({
      where: { id: dto.robotId },
      relations: ['competitor', 'competitor.club', 'competitor.user'],
    });

    // 2. Traer torneo CON SU CATEGORÍA
    const tournament = await this.tournamentRepo.findOne({
      where: { id: dto.tournamentId },
      relations: ['location', 'category'],
    });

    if (!robot || !tournament) {
      throw new NotFoundException('Robot o torneo no encontrado.');
    }

    const competitor = robot.competitor;
    const club = competitor.club;

    // 🔹 2.1. Validar que el club esté aprobado
    if (club.status !== ClubStatus.APPROVED) {
      throw new BadRequestException(
        'Tu club aún no está aprobado. No puedes inscribirte a torneos.',
      );
    }

    // 🔹 2.2. Validar que la cuenta del competidor no esté bloqueada
    if (competitor.user.isLocked) {
      throw new BadRequestException(
        'Tu cuenta está bloqueada. Contacta al dueño de tu club para habilitarla.',
      );
    }

    // 🔹 2.3. Validar que el competidor esté aprobado
    if (competitor.status !== CompetitorStatus.APPROVED) {
      throw new BadRequestException(
        'Tu perfil de competidor aún no está aprobado por tu club. No puedes inscribirte a torneos.',
      );
    }

    // 3. Validar estado del torneo
    if (tournament.estado !== TournamentStatus.OPEN) {
      throw new BadRequestException(
        'El torneo no está abierto para inscripciones.',
      );
    }

    // 4. Validar fechas del torneo
    if (tournament.inscripcionCierra && tournament.inscripcionCierra < ahora) {
      throw new BadRequestException(
        'Las inscripciones para este torneo ya cerraron.',
      );
    }

    if (tournament.fechaInicio && tournament.fechaInicio <= ahora) {
      throw new BadRequestException(
        'El torneo ya inició, no se permiten nuevas inscripciones.',
      );
    }

    // 5. Cooldown de 7 días
    const competitorId = competitor.id;

    const lastInscription = await this.inscriptionRepo
      .createQueryBuilder('ins')
      .leftJoin('ins.robot', 'r')
      .leftJoin('r.competitor', 'c')
      .leftJoin('ins.tournament', 't')
      .where('c.id = :competitorId', { competitorId })
      .orderBy('t.fechaInicio', 'DESC')
      .getOne();

    if (lastInscription && lastInscription.tournament?.fechaInicio) {
      const lastStart = lastInscription.tournament.fechaInicio;
      const diffMs = tournament.fechaInicio.getTime() - lastStart.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays < 7) {
        throw new ConflictException(
          'Ya participaste en un torneo recientemente. Debes esperar 7 días entre torneos.',
        );
      }
    }

    // 6. VALIDAR CATEGORÍA CON REGLA REAL (SIN TOCAR FRONT)
    const category = tournament.category;

    if (!category) {
      throw new BadRequestException('El torneo no tiene categoría configurada.');
    }

    // 6.1. Validar que el tipo de juego del robot matchee el del torneo
    // (a partir del texto que envía el front)
    if (category.gameType === GameType.COMBAT && robot.categoria !== 'Combate cuerpo a cuerpo') {
      throw new BadRequestException(
        `Tu robot es de tipo "${robot.categoria}", pero este torneo es de COMBATE.`
      );
    }

    if (category.gameType === GameType.SUMO && robot.categoria !== 'Lucha de sumos') {
      throw new BadRequestException(
        `Tu robot es de tipo "${robot.categoria}", pero este torneo es de SUMO.`
      );
    }

    if (category.gameType === GameType.RACE && robot.categoria !== 'Seguidor de línea') {
      throw new BadRequestException(
        `Tu robot es de tipo "${robot.categoria}", pero este torneo es de CARRERA.`
      );
    }

    // 6.2. Para COMBATE: subcategoría por peso
    if (category.gameType === GameType.COMBAT) {
      // clase real del robot, solo por peso
      const robotClass = this.getCombatClassFromWeight(robot.peso);
      // clase que representa el torneo, por nombre de la categoría
      const tournamentClass = this.getCombatClassFromCategoryName(category.name);

      if (robotClass === 'fuera_rango') {
        throw new BadRequestException(
          `El peso de tu robot (${robot.peso} g) está fuera de los rangos definidos para combate.`
        );
      }

      if (tournamentClass === 'desconocida') {
        throw new BadRequestException(
          `La categoría del torneo "${category.name}" no está configurada correctamente en el sistema.`
        );
      }

      if (robotClass !== tournamentClass) {
        throw new BadRequestException(
          `Categoría incorrecta. Tu robot es de peso ${robotClass.toUpperCase()} y el torneo es ${tournamentClass.toUpperCase()}.`
        );
      }
    }

    // 6.3. Para SUMO o CARRERA puedes hacer algo similar o solo validar peso máx:
    if (typeof category.maxWeightGrams === 'number' && category.maxWeightGrams > 0) {
      if (robot.peso > category.maxWeightGrams) {
        throw new BadRequestException(
          `El peso de tu robot (${robot.peso} g) excede el máximo permitido (${category.maxWeightGrams} g) para esta categoría.`
        );
      }
    }


    // 7. Cupos máximos
    const inscritosCount = await this.inscriptionRepo.count({
      where: { tournament: { id: tournament.id } },
    });

    if (
      typeof tournament.maxParticipantes === 'number' &&
      inscritosCount >= tournament.maxParticipantes
    ) {
      throw new ConflictException('Torneo lleno. No hay cupos disponibles.');
    }

    // 7.5 [NUEVO] Validar si el ROBOT está ocupado en OTRO torneo activo
    // Buscamos si existe alguna inscripción de este robot en un torneo que NO esté finalizado
    // y que NO sea el torneo actual (para eso es el id: Not(...))
    const robotBusy = await this.inscriptionRepo.findOne({
      where: {
        robot: { id: robot.id },
        tournament: { 
            // Si el torneo no ha terminado, el robot está ocupado.
            estado: Not(TournamentStatus.FINISHED), 
            id: Not(tournament.id) 
        }
      },
      relations: ['tournament'],
    });

    if (robotBusy) {
      throw new ConflictException(
        `Este robot no se puede inscribir porque sigue compitiendo en el torneo "${robotBusy.tournament.nombre}".`,
      );
    }

    // 8. No permitir duplicado
    const yaInscrito = await this.inscriptionRepo.findOne({
      where: {
        robot: { id: robot.id },
        tournament: { id: tournament.id },
      },
    });

    if (yaInscrito) {
      throw new ConflictException(
        'Este robot ya está inscrito en el torneo.',
      );
    }

    // 8.5  Regla del competidor: máximo 2 robots por categoría (en este caso, por torneo)
    const countFromCompetitor = await this.inscriptionRepo
      .createQueryBuilder('ins')
      .leftJoin('ins.robot', 'r')
      .leftJoin('r.competitor', 'c')
      .leftJoin('ins.tournament', 't')
      .where('t.id = :tournamentId', { tournamentId: tournament.id })
      .andWhere('c.id = :competitorId', { competitorId: competitor.id })
      .getCount();

    if (countFromCompetitor >= 2) {
      throw new ConflictException(
        'Ya alcanzaste el máximo de 2 robots inscritos permitidos para esta categoría en este torneo.',
      );
    }


    // 9. Regla del club (máximo 2)
    const clubId = club.id;

    const countFromClub = await this.inscriptionRepo
      .createQueryBuilder('ins')
      .leftJoin('ins.robot', 'r')
      .leftJoin('r.competitor', 'c')
      .leftJoin('c.club', 'club')
      .leftJoin('ins.tournament', 't')
      .where('t.id = :tournamentId', { tournamentId: tournament.id })
      .andWhere('club.id = :clubId', { clubId })
      .getCount();

    if (countFromClub >= 2) {
      throw new ConflictException(
        'Tu club ya tiene el máximo de 2 participantes permitidos en este torneo.',
      );
    }

    // 10. Crear y guardar
    const nuevaInscripcion = this.inscriptionRepo.create({
      robot,
      tournament,
    });

    return this.inscriptionRepo.save(nuevaInscripcion);
  }

  findAll() {
    return this.inscriptionRepo.find({ relations: ['robot', 'tournament'] });
  }

  // Obtener lista de inscritos para el Juez/Admin
  findByTournament(tournamentId: string) {
    return this.inscriptionRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['robot', 'robot.competitor', 'robot.competitor.club'],
      order: { score: 'DESC' }, // ranking en vivo
    });
  }

  // --- MÉTODO DEL JUEZ (CALIFICAR) ---
  async gradeRobot(inscriptionId: string, score: number) {
    const inscription = await this.inscriptionRepo.findOneBy({ id: inscriptionId });
    if (!inscription) throw new NotFoundException('Inscripción no encontrada');

    inscription.score = score;
    inscription.status = InscriptionStatus.QUALIFIED;

    return this.inscriptionRepo.save(inscription);
  }
}
