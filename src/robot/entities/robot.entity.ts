import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Competitor } from '../../competitor/entities/competitor.entity';

// Las categorías que mencionaste en los requisitos
export enum RobotCategory {
  SUMO = 'Lucha de sumos',
  COMBAT = 'Combate cuerpo a cuerpo',
  BOXING = 'Boxeo de robots',
  INTELLECT = 'Competencia intelectual',
  LINE_FOLLOWER = 'Seguidor de línea'
}

// ✅ NUEVO: estados del robot
export enum RobotStatus {
  ACTIVE = 'Activo',
  COMPETING = 'Compitiendo',
  MAINTENANCE = 'En mantenimiento',
  DESTROYED = 'Destruido en batalla',
}

@Entity('robots')
export class Robot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: RobotCategory })
  categoria: RobotCategory;

  @Column({ type: 'float', nullable: true })
  peso: number; // en gramos

  @Column({ nullable: true })
  fotoUrl: string; // URL de la imagen del robot

  // ✅ NUEVO: campo estado
  @Column({
    type: 'enum',
    enum: RobotStatus,
    default: RobotStatus.ACTIVE,
  })
  status: RobotStatus;

  
  // Un robot pertenece a UN competidor
  @ManyToOne(() => Competitor, (competitor) => competitor.robots)
  @JoinColumn()
  competitor: Competitor;
}
