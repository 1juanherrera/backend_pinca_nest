import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Instalacion } from './entities/instalacion.entity';
import {
  CreateInstalacionDto,
  UpdateInstalacionDto,
} from './dto/instalacion.dto';

/** Réplica fiel de InstalacionesController + InstalacionesModel (CI4). */
@Injectable()
export class InstalacionesService {
  constructor(
    @InjectRepository(Instalacion)
    private readonly repo: Repository<Instalacion>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Instalacion[]> {
    return this.repo.find({ order: { id_instalaciones: 'ASC' } });
  }

  async findOne(id: number): Promise<Instalacion> {
    const inst = await this.repo.findOne({ where: { id_instalaciones: id } });
    if (!inst) {
      throw new NotFoundException(`Instalación con ID ${id} no encontrada.`);
    }
    return inst;
  }

  /**
   * GET /instalaciones/bodegas/:id → objeto anidado (id + campos + bodegas[]).
   * OJO: replica CI4 → devuelve null (no 404) si la instalación no existe.
   * bodegas trae SOLO 4 claves: id_bodegas, nombre, descripcion, estado.
   */
  async withBodegas(id: number): Promise<Record<string, unknown> | null> {
    const inst = await this.repo.findOne({ where: { id_instalaciones: id } });
    if (!inst) return null;

    const bodegas = await this.dataSource.query(
      `SELECT id_bodegas, nombre, descripcion, estado
         FROM bodegas
        WHERE instalaciones_id = ? AND deleted_at IS NULL`,
      [id],
    );

    return {
      id_instalaciones: inst.id_instalaciones,
      nombre: inst.nombre,
      descripcion: inst.descripcion,
      ciudad: inst.ciudad,
      direccion: inst.direccion,
      telefono: inst.telefono,
      id_empresa: inst.id_empresa,
      bodegas,
    };
  }

  async create(dto: CreateInstalacionDto): Promise<number> {
    const saved = await this.repo.save(this.repo.create({ ...dto }));
    return saved.id_instalaciones;
  }

  async update(id: number, dto: UpdateInstalacionDto): Promise<void> {
    await this.findOne(id);
    await this.repo.update(id, { ...dto });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
