import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Competitor } from '../../competitor/entities/competitor.entity';
import { Club } from '../../club/entities/club.entity';
import { Tournament } from '../../tournament/entities/tournament.entity';
import { Match } from '../../match/entities/match.entity';
import { User } from '../../users/entities/user.entity';

export enum BehaviorSource {
  CLUB = 'CLUB',
  TOURNAMENT = 'TOURNAMENT',
}

export enum BehaviorCategory {
  TECHNICAL = 'TECHNICAL',
  CONDUCT = 'CONDUCT',
  GAME_RULES = 'GAME_RULES',
}

@Entity('behavior_events')
@Index(['competitor', 'createdAt'])
export class BehaviorEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Competitor, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;

  @Column({ type: 'enum', enum: BehaviorSource })
  source: BehaviorSource;

  @Column({ type: 'enum', enum: BehaviorCategory })
  category: BehaviorCategory;

  @Column({ length: 40 })
  type: string;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  severity: number;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Club, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clubId' })
  club?: Club | null;

  @ManyToOne(() => Tournament, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tournamentId' })
  tournament?: Tournament | null;

  @ManyToOne(() => Match, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'matchId' })
  match?: Match | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

@Column({ type: 'timestamp', nullable: true })
resolvedAt: Date | null;

@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'resolvedByUserId' })
resolvedBy?: User | null;

}
