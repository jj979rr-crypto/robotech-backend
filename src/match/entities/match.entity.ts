// src/match/entities/match.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tournament } from '../../tournament/entities/tournament.entity';
import { Inscription } from '../../inscription/entities/inscription.entity';

export enum MatchResult {
  A_WINS = 'A_WINS',
  B_WINS = 'B_WINS',
  DRAW = 'DRAW',
}

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el Torneo
  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  // Número de ronda (1, 2, 3...)
  @Column({ type: 'int' })
  round: number;

  // Índice del match dentro de la ronda (0, 1, 2...)
  @Column({ type: 'int' })
  matchIndex: number;

  // Participante A (Puede ser null si aún no se decide)
  @ManyToOne(() => Inscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inscriptionAId' })
  inscriptionA: Inscription | null;

  // Participante B (Puede ser null si es BYE o aún no se decide)
  @ManyToOne(() => Inscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inscriptionBId' })
  inscriptionB: Inscription | null;

  // Resultado
  @Column({ type: 'enum', enum: MatchResult, nullable: true })
  result: MatchResult | null;

  @Column({ type: 'timestamp', nullable: true })
  playedAt: Date;
  
  // Estado del match (PENDING, FINISHED, IN_PROGRESS)
  @Column({ default: 'PENDING' })
  status: string;
}