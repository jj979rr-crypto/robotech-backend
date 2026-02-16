import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Competitor } from '../../competitor/entities/competitor.entity';

// Estado del club para el panel del Admin
export enum ClubStatus {
  PENDING = 'pending',   // Recién registrado, nadie puede entrar
  APPROVED = 'approved', // El admin le dio el Check ✔
  REJECTED = 'rejected', // El admin lo rechazó
}

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;
 
  @Column()
  direccion: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  fotoUrl: string;

  // Estado de aprobación (Solo el admin puede cambiar esto)
  @Column({ type: 'enum', enum: ClubStatus, default: ClubStatus.PENDING })
  status: ClubStatus;

  // El Código de Invitación que el dueño comparte con los competidores
  // Ej: "ROBOT-SUR-2025"
  @Column({ unique: true, nullable: true })
  codigoInvitacion: string;

  // Relación: Un Club tiene UN Dueño (Usuario)
  @OneToOne(() => User, (user) => user.clubProfile)
  @JoinColumn() // Esta es la tabla que lleva la llave foránea
  owner: User;

  @OneToMany(() => Competitor, (competitor) => competitor.club)
  competitors: Competitor[];
}