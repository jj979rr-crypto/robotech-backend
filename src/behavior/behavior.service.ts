// src/behavior/behavior.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BehaviorEvent, BehaviorSource } from './entities/behavior-event.entity';
import { Competitor } from '../competitor/entities/competitor.entity';
import { Club } from '../club/entities/club.entity';
import { Match } from '../match/entities/match.entity';
import { User, StaffType, UserRole } from '../users/entities/user.entity';
import { CreateClubIncidentDto } from './dto/create-club-incident.dto';
import { CreateMatchIncidentDto } from './dto/create-match-incident.dto';
import { Inscription } from '../inscription/entities/inscription.entity';

@Injectable()
export class BehaviorService {
  constructor(
    @InjectRepository(BehaviorEvent)
    private readonly behaviorRepo: Repository<BehaviorEvent>,
    @InjectRepository(Competitor)
    private readonly competitorRepo: Repository<Competitor>,
    @InjectRepository(Club)
    private readonly clubRepo: Repository<Club>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Inscription)
    private readonly inscriptionRepo: Repository<Inscription>,
  ) {}

  // Dueño de club registra incidencia “interna”
  async createClubIncident(competitorId: string, dto: CreateClubIncidentDto, actorUserId: string) {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['clubProfile'],
    });
    if (!actor) throw new NotFoundException('Usuario no encontrado');

    if (actor.role !== UserRole.STAFF || actor.staffType !== StaffType.CLUB_OWNER) {
      throw new ForbiddenException('Solo el dueño del club puede registrar incidencias internas');
    }

    const ownerClub = actor.clubProfile;
    if (!ownerClub) throw new ForbiddenException('No tienes club asignado');

    const competitor = await this.competitorRepo.findOne({
      where: { id: competitorId },
      relations: ['club'],
    });
    if (!competitor) throw new NotFoundException('Competidor no encontrado');

    if (!competitor.club || competitor.club.id !== ownerClub.id) {
      throw new ForbiddenException('Solo puedes registrar incidencias de competidores de tu club');
    }

    const event = this.behaviorRepo.create({
      competitor,
      source: BehaviorSource.CLUB,
      category: dto.category,
      type: dto.type.trim().toUpperCase(),
      severity: dto.severity,
      description: dto.description.trim(),
      club: ownerClub,
      createdBy: actor,
      tournament: null,
      match: null,
    });

    return this.behaviorRepo.save(event);
  }

  // Juez registra incidencia ligada a un match (competidor debe ser A o B)
  async createMatchIncident(matchId: string, dto: CreateMatchIncidentDto, actorUserId: string) {
    const actor = await this.userRepo.findOne({ where: { id: actorUserId } });
    if (!actor) throw new NotFoundException('Usuario no encontrado');

    if (actor.role !== UserRole.STAFF || actor.staffType !== StaffType.JUDGE) {
      throw new ForbiddenException('Solo un juez puede registrar incidencias de torneo');
    }

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: [
        'tournament',
        'inscriptionA',
        'inscriptionB',
        // IMPORTANTÍSIMO: para saber qué competidores juegan
      ],
    });
    if (!match) throw new NotFoundException('Match no encontrado');

    // Traer inscripciones con robot->competitor->club
// ✅ CÓDIGO NUEVO Y SEGURO
      let insA: Inscription | null = null;
        if (match.inscriptionA) {
          insA = await this.inscriptionRepo.findOne({
            where: { id: match.inscriptionA.id },
            relations: ['robot', 'robot.competitor', 'robot.competitor.club'],
          });
      }

      let insB: Inscription | null = null;
        if (match.inscriptionB) {
          insB = await this.inscriptionRepo.findOne({
          where: { id: match.inscriptionB.id },
          relations: ['robot', 'robot.competitor', 'robot.competitor.club'],
        });
      }

    const competitorA = insA?.robot?.competitor;
    const competitorB = insB?.robot?.competitor;

    if (!competitorA || !competitorB) {
      throw new BadRequestException('El match no tiene competidores válidos para registrar incidencias');
    }

    if (dto.competitorId !== competitorA.id && dto.competitorId !== competitorB.id) {
      throw new BadRequestException('El competidor indicado no pertenece a este match');
    }

    const competitor = dto.competitorId === competitorA.id ? competitorA : competitorB;

    const event = this.behaviorRepo.create({
      competitor,
      source: BehaviorSource.TOURNAMENT,
      category: dto.category,
      type: dto.type.trim().toUpperCase(),
      severity: dto.severity,
      description: dto.description.trim(),
      tournament: match.tournament,
      match: match,
      club: competitor.club ?? null, // club al momento del evento (opcional)
      createdBy: actor,
    });

    return this.behaviorRepo.save(event);
  }

  // Ver historial (staff o el propio competidor)
  async listByCompetitor(competitorId: string, actorUserId: string) {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['competitorProfile', 'clubProfile'],
    });
    if (!actor) throw new NotFoundException('Usuario no encontrado');

    const isSelfCompetitor =
      actor.role === UserRole.COMPETITOR &&
      actor.competitorProfile &&
      actor.competitorProfile.id === competitorId;

    const isStaff = actor.role === UserRole.STAFF;

    if (!isSelfCompetitor && !isStaff) {
      throw new ForbiddenException('No autorizado para ver este historial');
    }

    // Si quieres restringir a dueños “solo su club”, aquí es el lugar.
    if (isStaff && actor.staffType === StaffType.CLUB_OWNER) {
      const competitor = await this.competitorRepo.findOne({
        where: { id: competitorId },
        relations: ['club'],
      });
      if (!competitor) throw new NotFoundException('Competidor no encontrado');

      if (!actor.clubProfile || !competitor.club || competitor.club.id !== actor.clubProfile.id) {
        throw new ForbiddenException('Solo puedes ver el historial de competidores de tu club');
      }
    }

    return this.behaviorRepo.find({
      where: { competitor: { id: competitorId } },
      relations: ['createdBy', 'club', 'tournament', 'match'],
      order: { createdAt: 'DESC' },
    });
  }

  async resolveEvent(eventId: string, actorUserId: string) {
  const actor = await this.userRepo.findOne({
    where: { id: actorUserId },
    relations: ['clubProfile'],
  });
  if (!actor) throw new NotFoundException('Usuario no encontrado');

  if (actor.role !== UserRole.STAFF) {
    throw new ForbiddenException('Solo staff puede resolver incidencias');
  }

  const event = await this.behaviorRepo.findOne({
    where: { id: eventId },
    relations: ['competitor', 'competitor.club', 'resolvedBy'],
  });
  if (!event) throw new NotFoundException('Incidencia no encontrada');

  // Club owner: solo competidores de su club
  if (actor.staffType === StaffType.CLUB_OWNER) {
    const ownerClubId = actor.clubProfile?.id;
    const compClubId = event.competitor?.club?.id;

    if (!ownerClubId || !compClubId || ownerClubId !== compClubId) {
      throw new ForbiddenException('Solo puedes resolver incidencias de tu club');
    }
  }
    // si ya está resuelta, no revientes
  if (event.resolvedAt) return event;

  event.resolvedAt = new Date();
  event.resolvedBy = actor;

  return this.behaviorRepo.save(event);
  }

}
