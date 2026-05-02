import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoriesRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async findAll() {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
    }

    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.categoriesRepository.remove(category);
  }

  async seedDefaults() {
    const defaults = [
      { name: 'Academic', description: 'Lectures, seminars, conferences', colorHex: '#3b82f6' },
      { name: 'Social', description: 'Mixers, parties, gatherings', colorHex: '#ec4899' },
      { name: 'Sports', description: 'Tournaments, fitness, athletics', colorHex: '#10b981' },
      { name: 'Cultural', description: 'Music, art, theater, festivals', colorHex: '#f59e0b' },
      { name: 'Workshop', description: 'Hands-on training and skill-building', colorHex: '#8b5cf6' },
    ];

    const results = [];
    for (const cat of defaults) {
      const existing = await this.categoriesRepository.findOne({ where: { name: cat.name } });
      if (!existing) {
        const created = this.categoriesRepository.create(cat);
        results.push(await this.categoriesRepository.save(created));
      }
    }
    return { seeded: results.length, categories: await this.findAll() };
  }
}
