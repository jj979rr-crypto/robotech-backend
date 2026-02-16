import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Location } from '../../location/entities/location.entity';
import { Inscription } from '../../inscription/entities/inscription.entity';
// ✅ CORRECCIÓN: Agregamos el import que faltaba
import { Category } from '../../categories/entities/category.entity'; 

export enum TournamentStatus {
  OPEN = 'Abierto',
  CLOSED = 'Cerrado',
  IN_PROGRESS = 'En Curso',
  FINISHED = 'Finalizado',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({unique: true})
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // ✅ Ahora sí funcionará porque "Category" está importado arriba
  @ManyToOne(() => Category, (category) => category.tournaments, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => Location, (location) => location.tournaments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @OneToMany(() => Inscription, (inscription) => inscription.tournament, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  inscriptions: Inscription[];

  @Column({ type: 'datetime' })
  fechaInicio: Date;

  @Column({ type: 'datetime', nullable: true })
  fechaFin: Date | null;

  @Column({ type: 'int', default: 8 })
  minParticipantes: number;

  @Column({ type: 'int', default: 16 })
  maxParticipantes: number;

  @Column({ type: 'datetime', nullable: true })
  inscripcionCierra: Date | null;

  @Column({ default: false })
  esPublico: boolean;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.OPEN,
  })
  estado: TournamentStatus;

  @Column({ nullable: true })
  imagenUrl: string;

  @Column({ type: 'json', nullable: true })
  fixture: any;
}