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

  /**
   * GET /proveedores
   * Retrocompatible: sin `page` → array crudo (order id ASC). Con `page` →
   * { data, meta }. Filtro `q` (empresa|encargado|documento|email). QueryBuilder
   * respeta el soft-delete. La tabla `proveedor` no tiene columna estado.
   */
  async findAll(
    query: Record<string, string> = {},
  ): Promise<
    | Proveedor[]
    | {
        data: Proveedor[];
        meta: { total: number; page: number; limit: number; pages: number };
      }
  > {
    const qb = this.repo.createQueryBuilder('p').orderBy('p.id_proveedor', 'ASC');
    if (query.q) {
      qb.andWhere(
        '(p.nombre_empresa LIKE :q OR p.nombre_encargado LIKE :q OR p.numero_documento LIKE :q OR p.email LIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    if (!query.page) {
      return qb.getMany();
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
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
