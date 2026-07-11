import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { Proveedor } from './entities/proveedor.entity';
import {
  CreateProveedorDto,
  UpdateProveedorDto,
} from './dto/proveedor.dto';

/**
 * Réplica fiel de ProveedorController + ProveedorModel (CI4).
 * NOTA: los endpoints /proveedor_items (con items anidados) NO se migran en
 * Fase 1 — dependen del dominio item_proveedor. Los sigue sirviendo CI4.
 * NO existe GET /proveedores/:id (show) en CI4.
 */
@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly repo: Repository<Proveedor>,
  ) {}

  findAll(): Promise<Proveedor[]> {
    return this.repo.find({ order: { id_proveedor: 'ASC' } });
  }

  /** Busca activo (deleted_at IS NULL). 404 si no existe. */
  private async findActivo(id: number): Promise<Proveedor> {
    const prov = await this.repo.findOne({ where: { id_proveedor: id } });
    if (!prov) throw new NotFoundException(`Proveedor con ID ${id} no encontrado.`);
    return prov;
  }

  async create(dto: CreateProveedorDto): Promise<number> {
    const saved = await this.repo.save(this.repo.create({ ...dto }));
    return saved.id_proveedor;
  }

  async update(id: number, dto: UpdateProveedorDto): Promise<void> {
    await this.findActivo(id);
    await this.repo.update(id, { ...dto });
  }

  /** DELETE = soft-delete ("archivado"). 404 si no existe. */
  async remove(id: number): Promise<void> {
    await this.findActivo(id);
    await this.repo.softDelete(id);
  }

  /**
   * POST /:id/restore. Busca INCLUYENDO archivados:
   *  - no existe → 404
   *  - no está archivado (deleted_at null) → 400 "El proveedor no está archivado."
   *  - archivado → restore (deleted_at = NULL)
   */
  async restore(id: number): Promise<void> {
    const existe = await this.repo.findOne({
      where: { id_proveedor: id },
      withDeleted: true,
    });
    if (!existe) throw new NotFoundException(`Proveedor con ID ${id} no encontrado.`);

    const archivado = await this.repo.findOne({
      where: { id_proveedor: id, deleted_at: Not(IsNull()) },
      withDeleted: true,
    });
    if (!archivado) throw new BadRequestException('El proveedor no está archivado.');

    await this.repo.restore(id);
  }
}
