// src/match/match.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match, MatchResult } from './entities/match.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { Inscription } from '../inscription/entities/inscription.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,

    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,

    @InjectRepository(Inscription)
    private readonly inscriptionRepo: Repository<Inscription>,

    private readonly dataSource: DataSource,
  ) {}

  // =========================================================
  // 🆕 MÉTODO PRINCIPAL: GENERAR FIXTURE AUTOMÁTICO
  // =========================================================
  async generateFixture(tournamentId: string) {
    // 1. Verificar si ya existe fixture (matches creados)
    const existingMatches = await this.matchRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: [
        'inscriptionA', 
        'inscriptionB', 
        'inscriptionA.robot', 
        'inscriptionB.robot', 
        'inscriptionA.robot.competitor.club', 
        'inscriptionB.robot.competitor.club'
      ],
      order: { round: 'ASC', matchIndex: 'ASC' }
    });

    if (existingMatches.length > 0) {
      return this.organizeMatchesIntoRounds(existingMatches);
    }

    // 2. Obtener inscritos válidos
    const inscriptions = await this.inscriptionRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['robot', 'robot.competitor', 'robot.competitor.club'],
    });

    if (inscriptions.length < 2) {
      return []; 
    }

    // 3. Algoritmo de Emparejamiento
    const pairings = this.createPairingsWithClubConstraint(inscriptions);

    // 4. Guardar en Base de Datos (Transacción)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // A. Guardar Ronda 1
      for (let i = 0; i < pairings.length; i++) {
        const pair = pairings[i];
        
        // CORRECCIÓN: Usamos 'new Match()' para evitar conflictos de tipos
        const match = new Match();
        match.tournament = { id: tournamentId } as Tournament;
        match.round = 1;
        match.matchIndex = i;
        match.inscriptionA = pair.p1;
        match.inscriptionB = pair.p2; // Acepta null gracias al cambio en la entidad
        match.result = null;
        match.status = 'PENDING';

        await queryRunner.manager.save(Match, match); 
      }

      // B. Crear Rondas Siguientes
      let currentRoundMatches = pairings.length;
      let round = 2;

      while (currentRoundMatches > 1) {
        const nextRoundMatchesCount = Math.ceil(currentRoundMatches / 2);
        
        for (let i = 0; i < nextRoundMatchesCount; i++) {
          const match = new Match();
          match.tournament = { id: tournamentId } as Tournament;
          match.round = round;
          match.matchIndex = i;
          match.inscriptionA = null;
          match.inscriptionB = null;
          match.result = null;
          match.status = 'PENDING';

          await queryRunner.manager.save(Match, match);
        }
        currentRoundMatches = nextRoundMatchesCount;
        round++;
      }

      await queryRunner.commitTransaction();

      // 5. Devolver todo ordenado
      return this.generateFixture(tournamentId);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- LÓGICA DE EMPAREJAMIENTO ---
  private createPairingsWithClubConstraint(inscriptions: Inscription[]) {
    // Definimos la interfaz aquí para asegurar el tipado
    interface MatchPair {
      p1: Inscription;
      p2: Inscription | null;
    }

    // 1. Barajar aleatoriamente
    let pool = inscriptions.sort(() => Math.random() - 0.5);
    const pairings: MatchPair[] = [];

    while (pool.length > 0) {
      const p1 = pool.shift(); 
      if (!p1) break;

      let p2Index = -1;
      const p1ClubId = p1.robot?.competitor?.club?.id;

      // 2. Buscar oponente de DIFERENTE club
      if (pool.length > 0) {
        for (let i = 0; i < pool.length; i++) {
          const candidate = pool[i];
          const candidateClubId = candidate.robot?.competitor?.club?.id;

          // Si son de clubs distintos (o alguno no tiene club), es válido
          if (!p1ClubId || !candidateClubId || p1ClubId !== candidateClubId) {
            p2Index = i;
            break;
          }
        }

        // 3. Fallback: Si no hay de otro club, toma el primero disponible
        if (p2Index === -1) {
           p2Index = 0; 
        }
        
        const p2 = pool.splice(p2Index, 1)[0];
        pairings.push({ p1, p2 });
      } else {
        // Si quedó solo (impar), pasa directo (BYE)
        pairings.push({ p1, p2: null });
      }
    }
    return pairings;
  }

  // Helper para organizar la respuesta
  private organizeMatchesIntoRounds(matches: Match[]) {
    const rounds: Match[][] = [];
    matches.forEach(m => {
      const rIndex = m.round - 1;
      if (!rounds[rIndex]) rounds[rIndex] = [];
      rounds[rIndex].push(m);
    });
    return rounds;
  }

  // =========================================================
  // MÉTODOS DE SOPORTE (Create manual y Reportar resultado)
  // =========================================================

  async createCombatMatch(dto: any) { 
     return null; 
  }

  async reportCombatResult(matchId: string, result: any) {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: ['tournament', 'inscriptionA', 'inscriptionB'],
    });
    
    if (!match) throw new NotFoundException('Match no encontrado');

    // Lógica básica de puntos (se puede expandir luego)
    match.result = result;
    match.playedAt = new Date();
    return this.matchRepo.save(match);
  }

  async listByTournament(tournamentId: string) {
    return this.generateFixture(tournamentId);
  }
}