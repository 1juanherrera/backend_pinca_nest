import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

/** Réplica fiel de CategoriaController + CategoriaModel (CI4). */
@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repo: Repository<Categoria>,
  ) {}

  findAll(): Promise<Categoria[]> {
    return this.repo.find({ order: { id_categoria: 'ASC' } });
  }

  async findOne(id: number): Promise<Categoria> {
    const cat = await this.repo.findOne({ where: { id_categoria: id } });
    if (!cat) throw new NotFoundException(`categoria con ID ${id} no encontrada.`);
    return cat;
  }

  async create(dto: CreateCategoriaDto): Promise<number> {
    const saved = await this.repo.save(this.repo.create({ nombre: dto.nombre }));
    return saved.id_categoria;
  }

  async update(id: number, dto: UpdateCategoriaDto): Promise<void> {
    await this.findOne(id);
    if (dto.nombre !== undefined) {
      await this.repo.update(id, { nombre: dto.nombre });
    }
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
