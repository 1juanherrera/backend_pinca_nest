import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Bodega } from './entities/bodega.entity';
import { CreateBodegaDto, UpdateBodegaDto } from './dto/bodega.dto';

/**
 * Réplica fiel de BodegasController + BodegasModel (CI4).
 * NOTA: `bodega_inventario` (GET /bodegas/inventario/:id) NO se migra en Fase 1
 * — depende del dominio inventario/capas. Esa ruta la sigue sirviendo CI4.
 */
@Injectable()
export class BodegasService {
  constructor(
    @InjectRepository(Bodega)
    private readonly repo: Repository<Bodega>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * GET /bodegas → array crudo CON `sede_nombre` (LEFT JOIN instalaciones).
   * Replica el SQL exacto del BodegasModel (b.* + i.nombre AS sede_nombre).
   */
  findAll(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT b.*, i.nombre AS sede_nombre
         FROM bodegas b
         LEFT JOIN instalaciones i
                ON i.id_instalaciones = b.instalaciones_id
               AND i.deleted_at IS NULL
        WHERE b.deleted_at IS NULL
        ORDER BY i.nombre, b.nombre`,
    );
  }

  /** GET /bodegas/:id → objeto crudo SIN sede_nombre (SELECT * sin JOIN). */
  async findOne(id: number): Promise<Bodega> {
    const bodega = await this.repo.findOne({ where: { id_bodegas: id } });
    if (!bodega) throw new NotFoundException(`Bodega con ID ${id} no encontrada.`);
    return bodega;
  }

  async create(dto: CreateBodegaDto): Promise<number> {
    const saved = await this.repo.save(
      this.repo.create({
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        estado: dto.estado ?? null,
        instalaciones_id: dto.instalaciones_id,
      }),
    );
    return saved.id_bodegas;
  }

  async update(id: number, dto: UpdateBodegaDto): Promise<void> {
    await this.findOne(id);
    await this.repo.update(id, {
      ...(dto.nombre !== undefined && { nombre: dto.nombre }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.instalaciones_id !== undefined && {
        instalaciones_id: dto.instalaciones_id,
      }),
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
