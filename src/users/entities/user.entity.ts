import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { Club } from '../../club/entities/club.entity';
import { Competitor } from '../../competitor/entities/competitor.entity';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  COMPETITOR = 'competitor',
  JUDGE = 'judge',
}

export enum StaffType {
  CLUB_OWNER = 'club_owner',
  JUDGE = 'judge',
  NONE = 'none',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // === NUEVOS CAMPOS AGREGADOS PARA COINCIDIR CON EL DTO ===
  
  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column({ length: 8, nullable: true }) // DNI suele ser 8 caracteres (en Perú). Nullable si hay usuarios (como admin) sin DNI.
  dni: string;

  // =========================================================

  @Column({ type: 'enum', enum: UserRole, default: UserRole.COMPETITOR })
  role: UserRole;

  @Column({ type: 'enum', enum: StaffType, default: StaffType.NONE })
  staffType: StaffType;

  @Column({ default: true })
  isActive: boolean;

  // --- SECCIÓN DE SEGURIDAD (2FA y Recuperación) ---
  
  @Column({ type: 'varchar', nullable: true }) 
  twoFactorSecret: string | null;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'datetime', nullable: true })
  resetPasswordExpires: Date | null;

  // --------------------------------------------------

  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @OneToOne(() => Club, (club) => club.owner, { nullable: true })
  clubProfile: Club;

  @OneToOne(() => Competitor, (competitor) => competitor.user, { nullable: true })
  competitorProfile: Competitor;
  
  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ default: false })
  isLocked: boolean;
}