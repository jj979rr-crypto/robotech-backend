import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, GameType } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Este método se ejecuta automáticamente cuando arranca tu backend
  async onModuleInit() {
    await this.seedCategories();
  }

    create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll() {
    return this.categoryRepository.find();
  }

  findOne(id: number) {
    return this.categoryRepository.findOneBy({ id });
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  remove(id: number) {
    return this.categoryRepository.delete(id);
  }

  async seedCategories() {
    const count = await this.categoryRepository.count();
    if (count > 0) return; // Si ya hay datos, no hace nada.

    // AQUI ESTÁN TUS DATOS EN ESPAÑOL Y UNIDADES
    const initialCategories = [
      // --- COMBATE ---
      {
        name: 'Peso Hada (Fairyweight)',
        description: 'Robots de combate ultra ligeros. Ideal para iniciación.',
        maxWeightGrams: 150, // 150g
        gameType: GameType.COMBAT,
      },
      {
        name: 'Peso Hormiga (Antweight)',
        description: 'La categoría clásica. Combate en cubo de 4 pulgadas.',
        maxWeightGrams: 454, // 1 libra exacta
        gameType: GameType.COMBAT,
      },
      {
        name: 'Peso Escarabajo (Beetleweight)',
        description: 'Combate de alto impacto y velocidad.',
        maxWeightGrams: 1361, // 3 libras
        gameType: GameType.COMBAT,
      },
      
      // --- SUMO ---
      {
        name: 'Mini Sumo (Autónomo)',
        description: 'Robots autónomos que buscan empujar al rival.',
        maxWeightGrams: 500, // 500g
        gameType: GameType.SUMO,
      },
      {
        name: 'Sumo (3kg)',
        description: 'Sumo de alta potencia, permite uso de imanes.',
        maxWeightGrams: 3000, // 3kg
        gameType: GameType.SUMO,
      },

      // --- CARRERA ---
      {
        name: 'Seguidor de Línea',
        description: 'Velocistas que recorren un circuito marcado.',
        maxWeightGrams: 0, // Sin límite estricto de peso, solo dimensiones
        gameType: GameType.RACE,
      },
    ];

    await this.categoryRepository.save(initialCategories);
    console.log('✅ Categorías insertadas correctamente en la Base de Datos');
  }
}