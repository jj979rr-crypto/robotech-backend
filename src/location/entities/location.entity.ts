import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Tournament } from '../../tournament/entities/tournament.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({unique: true})
  nombre: string; // Ej: "Coliseo Arequipa"

  @Column()
  direccion: string;

  @Column({ type: 'int' })
  capacidad: number; // Aforo máximo

  @Column({ default: true })
  disponible: boolean; // Por si entra en mantenimiento

  @Column({ type: 'text', nullable: true })
  descripcion: string; // Descripción adicional de la sede

  @Column({ type: 'text', nullable: true }) 
  imagenUrl: string | null; // URL de una imagen representativa de la sede

  @Column({ type: 'text', nullable: true })
  mapaUrl: string | null; // URL de un mapa o plano de la sede

  // Una sede puede tener MUCHOS torneos
  // Configuración CASCADE: Si borras la sede, se borran sus torneos automáticamente
  @OneToMany(() => Tournament, (tournament) => tournament.location, { 
    cascade: true, 
    onDelete: 'CASCADE' 
  })
  tournaments: Tournament[];
}