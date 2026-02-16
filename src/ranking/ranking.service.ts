// src/ranking/ranking.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Inscription,
  InscriptionStatus,
} from '../inscription/entities/inscription.entity';
import { ClubStatus } from '../club/entities/club.entity';
import { CompetitorStatus } from '../competitor/entities/competitor.entity';

export type Semester = 1 | 2;

export interface RankingFilter {
  year?: number;
  semester?: Semester;
  categoryId?: string;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Inscription)
    private readonly inscriptionRepo: Repository<Inscription>,
  ) {}

  // Rango de fechas por semestre
  private getSemesterRange(year: number, semester: Semester) {
    const start = new Date(year, semester === 1 ? 0 : 6, 1); // Ene / Jul
    const end = new Date(
      year,
      semester === 1 ? 5 : 11,
      31,
      23,
      59,
      59,
      999,
    ); // Jun / Dic
    return { start, end };
  }

  // =============== RANKING COMPETIDORES ===============
  async getCompetitorRanking(filters: RankingFilter) {
    const qb = this.inscriptionRepo
      .createQueryBuilder('ins')
      .leftJoin('ins.tournament', 't')
      .leftJoin('ins.robot', 'r')
      .leftJoin('r.competitor', 'c')
      .leftJoin('c.club', 'club')
      .leftJoin('t.category', 'cat')
      .where('ins.status = :insStatus', {
        insStatus: InscriptionStatus.QUALIFIED,
      })
      .andWhere('c.status = :cStatus', {
        cStatus: CompetitorStatus.APPROVED,
      })
      .andWhere('club.status = :clubStatus', {
        clubStatus: ClubStatus.APPROVED,
      });

    if (filters.year && filters.semester) {
      const { start, end } = this.getSemesterRange(
        filters.year,
        filters.semester,
      );
      qb.andWhere('t.fechaInicio BETWEEN :start AND :end', { start, end });
    }

    if (filters.categoryId) {
      qb.andWhere('cat.id = :catId', { catId: filters.categoryId });
    }

    qb
      .select([
        'c.id AS competitorId',
        'c.nickname AS nickname',
        'c.nombres AS nombres',
        'c.apellidos AS apellidos',
        'club.id AS clubId',
        'club.nombre AS clubNombre',
        'SUM(ins.score) AS totalPoints',
        'COUNT(DISTINCT t.id) AS eventsPlayed',
        'MAX(ins.score) AS bestScore',
      ])
      .groupBy('c.id')
      .addGroupBy('club.id')
      .orderBy('totalPoints', 'DESC')
      .addOrderBy('bestScore', 'DESC');

    const raw = await qb.getRawMany();

    return raw.map((row: any, index: number) => ({
      position: index + 1,
      competitorId: row.competitorId,
      nickname: row.nickname,
      nombres: row.nombres,
      apellidos: row.apellidos,
      clubId: row.clubId,
      clubNombre: row.clubNombre,
      totalPoints: Number(row.totalPoints) || 0,
      eventsPlayed: Number(row.eventsPlayed) || 0,
      bestScore: Number(row.bestScore) || 0,
    }));
  }

  // =============== RANKING CLUBES ===============
  async getClubRanking(filters: RankingFilter) {
    const qb = this.inscriptionRepo
      .createQueryBuilder('ins')
      .leftJoin('ins.tournament', 't')
      .leftJoin('ins.robot', 'r')
      .leftJoin('r.competitor', 'c')
      .leftJoin('c.club', 'club')
      .leftJoin('t.category', 'cat')
      .where('ins.status = :insStatus', {
        insStatus: InscriptionStatus.QUALIFIED,
      })
      .andWhere('club.status = :clubStatus', {
        clubStatus: ClubStatus.APPROVED,
      });

    if (filters.year && filters.semester) {
      const { start, end } = this.getSemesterRange(
        filters.year,
        filters.semester,
      );
      qb.andWhere('t.fechaInicio BETWEEN :start AND :end', { start, end });
    }

    if (filters.categoryId) {
      qb.andWhere('cat.id = :catId', { catId: filters.categoryId });
    }

    qb
      .select([
        'club.id AS clubId',
        'club.nombre AS clubNombre',
        'SUM(ins.score) AS totalPoints',
        'COUNT(DISTINCT c.id) AS competitorsCount',
        'COUNT(ins.id) AS inscriptionsCount',
      ])
      .groupBy('club.id')
      .orderBy('totalPoints', 'DESC');

    const raw = await qb.getRawMany();

    return raw.map((row: any, index: number) => ({
      position: index + 1,
      clubId: row.clubId,
      clubNombre: row.clubNombre,
      totalPoints: Number(row.totalPoints) || 0,
      competitorsCount: Number(row.competitorsCount) || 0,
      inscriptionsCount: Number(row.inscriptionsCount) || 0,
    }));
  }

  // =============== RANKING CATEGORÍAS ===============
  async getCategoryRanking(filters: RankingFilter) {
    const qb = this.inscriptionRepo
      .createQueryBuilder('ins')
      .leftJoin('ins.tournament', 't')
      .leftJoin('t.category', 'cat')
      .leftJoin('ins.robot', 'r')
      .leftJoin('r.competitor', 'c')
      .leftJoin('c.club', 'club')
      .where('ins.status = :insStatus', {
        insStatus: InscriptionStatus.QUALIFIED,
      });

    if (filters.year && filters.semester) {
      const { start, end } = this.getSemesterRange(
        filters.year,
        filters.semester,
      );
      qb.andWhere('t.fechaInicio BETWEEN :start AND :end', { start, end });
    }

    qb
      .select([
        'cat.id AS categoryId',
        'cat.name AS categoryName',
        'SUM(ins.score) AS totalPoints',
        'COUNT(DISTINCT c.id) AS competitorsCount',
        'COUNT(DISTINCT club.id) AS clubsCount',
      ])
      .groupBy('cat.id')
      .orderBy('totalPoints', 'DESC');

    const raw = await qb.getRawMany();

    return raw.map((row: any, index: number) => ({
      position: index + 1,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      totalPoints: Number(row.totalPoints) || 0,
      competitorsCount: Number(row.competitorsCount) || 0,
      clubsCount: Number(row.clubsCount) || 0,
    }));
  }
}
