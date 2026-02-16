import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Robot } from '../../robot/entities/robot.entity';
import { Tournament } from '../../tournament/entities/tournament.entity';

export enum InscriptionStatus {
  PENDING = 'Pendiente',
  ACCEPTED = 'Aceptado',
  REJECTED = 'Rechazado',
  // Estados de resultado
  QUALIFIED = 'Calificado',
  ELIMINATED = 'Eliminado',
  WINNER = 'Ganador',
}

@Entity('inscriptions')
export class Inscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Si se elimina el robot, se elimina su inscripción automáticamente
  @ManyToOne(() => Robot, { onDelete: 'CASCADE' })
  @JoinColumn()
  robot: Robot;

  // Si se elimina el torneo, se eliminan todas sus inscripciones automáticamente
  @ManyToOne(
    () => Tournament,
    (tournament) => tournament.inscriptions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  tournament: Tournament;

  @Column({
    type: 'enum',
    enum: InscriptionStatus,
    default: InscriptionStatus.ACCEPTED,
  })
  status: InscriptionStatus;

  // --- PUNTAJE DEL JUEZ ---
  @Column({ type: 'float', default: 0 })
  score: number;

  @CreateDateColumn()
  fechaInscripcion: Date;
}
