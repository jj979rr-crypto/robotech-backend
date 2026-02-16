import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Club } from '../../club/entities/club.entity';
import { Robot } from '../../robot/entities/robot.entity';

export enum CompetitorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
}

@Entity('competitors')
export class Competitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column({ length: 8, unique: true })
  dni: string;

  @Column({ unique: true, length: 20 })
  nickname: string;

  @Column({ nullable: true })
  fotoUrl: string;

  // Estado dentro del club (para el dueño del club)
  @Column({
    type: 'enum',
    enum: CompetitorStatus,
    default: CompetitorStatus.PENDING, // o PENDING si quieres aprobarlos antes de que usen el panel
  })
  status: CompetitorStatus;

  @OneToOne(() => User, (user) => user.competitorProfile)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Club, (club) => club.competitors)
  club: Club;

  @OneToMany(() => Robot, (robot) => robot.competitor)
  robots: Robot[];
}
