import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Unidad } from './entities/unidad.entity';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';

/**
 * Réplica fiel de UnidadController + UnidadModel (CI4).
 * Soft-delete vía @DeleteDateColumn (TypeORM filtra deleted_at IS NULL solo).
 */
@Injectable()
export class UnidadesService {
  constructor(
    @InjectRepository(Unidad)
    private readonly repo: Repository<Unidad>,
  ) {}

  /** GET /unidades → array crudo (get_all filtra deleted_at IS NULL). */
  findAll(): Promise<Unidad[]> {
    return this.repo.find({ order: { id_unidad: 'ASC' } });
  }

  /** GET /unidades/:id → objeto crudo. 404 "unidad con ID X no encontrada." */
  async findOne(id: number): Promise<Unidad> {
    const unidad = await this.repo.findOne({ where: { id_unidad: id } });
    if (!unidad) {
      throw new NotFoundException(`unidad con ID ${id} no encontrada.`);
    }
    return unidad;
  }

  /** POST → devuelve el insert id (el controller arma {mensaje, id}). */
  async create(dto: CreateUnidadDto): Promise<number> {
    const unidad = this.repo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      estados: dto.estados ?? null,
      escala: dto.escala !== undefined ? String(dto.escala) : null,
    });
    const saved = await this.repo.save(unidad);
    return saved.id_unidad;
  }

  /** PUT → verifica existencia (404) y actualiza los allowedFields. */
  async update(id: number, dto: UpdateUnidadDto): Promise<void> {
    await this.findOne(id);
    await this.repo.update(id, {
      ...(dto.nombre !== undefined && { nombre: dto.nombre }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
      ...(dto.estados !== undefined && { estados: dto.estados }),
      ...(dto.escala !== undefined && { escala: String(dto.escala) }),
    });
  }

  /** DELETE → soft-delete (marca deleted_at). 404 si no existe. */
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
