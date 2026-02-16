import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// CORRECCIÓN: Usamos ruta relativa (subir 2 niveles e ir a tournament)
import { Tournament } from '../../tournament/entities/tournament.entity';

export enum GameType {
  COMBAT = 'COMBATE',
  SUMO = 'SUMO',
  RACE = 'CARRERA',
}

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('int')
  maxWeightGrams: number;

  @Column({
    type: 'enum',
    enum: GameType,
    default: GameType.COMBAT
  })
  gameType: GameType;

  @OneToMany(() => Tournament, (tournament) => tournament.category)
  tournaments: Tournament[];
}