import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

/** Réplica fiel de ClientesController + ClientesModel (CI4). */
@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repo: Repository<Cliente>,
  ) {}

  /**
   * Sólo los allowedFields de CI4 se persisten. `limite_credito`, `dias_credito`
   * y `credito_usado` NO están en allowedFields → se descartan al guardar
   * (aunque limite_credito sí se valida y se hace eco en la respuesta).
   */
  private toPersistable(
    dto: CreateClienteDto | UpdateClienteDto,
  ): Partial<Cliente> {
    const out: Partial<Cliente> = {};
    if (dto.nombre_encargado !== undefined) out.nombre_encargado = dto.nombre_encargado;
    if (dto.nombre_empresa !== undefined) out.nombre_empresa = dto.nombre_empresa;
    if (dto.numero_documento !== undefined) out.numero_documento = dto.numero_documento;
    if (dto.direccion !== undefined) out.direccion = dto.direccion;
    if (dto.ciudad !== undefined) out.ciudad = dto.ciudad;
    if (dto.plazo_pago !== undefined) out.plazo_pago = dto.plazo_pago;
    if (dto.telefono !== undefined) out.telefono = dto.telefono;
    if (dto.email !== undefined) out.email = dto.email;
    if (dto.tipo !== undefined) out.tipo = dto.tipo;
    if (dto.estado !== undefined) out.estado = dto.estado;
    return out;
  }

  /**
   * GET /clientes
   * Retrocompatible: sin `page` → array crudo (order id ASC, como antes). Con `page`
   * → { data, meta } paginado server-side. Filtro `q` (empresa|encargado|documento|
   * email|ciudad). QueryBuilder respeta el soft-delete (@DeleteDateColumn).
   */
  async findAll(
    query: Record<string, string> = {},
  ): Promise<
    | Cliente[]
    | {
        data: Cliente[];
        meta: { total: number; page: number; limit: number; pages: number };
      }
  > {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.id_clientes', 'ASC');
    if (query.q) {
      qb.andWhere(
        '(c.nombre_empresa LIKE :q OR c.nombre_encargado LIKE :q OR CAST(c.numero_documento AS CHAR) LIKE :q OR c.email LIKE :q OR c.ciudad LIKE :q)',
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

  async findOne(id: number): Promise<Cliente> {
    const cli = await this.repo.findOne({ where: { id_clientes: id } });
    if (!cli) throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
    return cli;
  }

  async create(dto: CreateClienteDto): Promise<number> {
    const saved = await this.repo.save(this.repo.create(this.toPersistable(dto)));
    return saved.id_clientes;
  }

  async update(id: number, dto: UpdateClienteDto): Promise<void> {
    await this.findOne(id);
    await this.repo.update(id, this.toPersistable(dto));
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    const existe = await this.repo.findOne({
      where: { id_clientes: id },
      withDeleted: true,
    });
    if (!existe) throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);

    const archivado = await this.repo.findOne({
      where: { id_clientes: id, deleted_at: Not(IsNull()) },
      withDeleted: true,
    });
    if (!archivado) throw new BadRequestException('El cliente no está archivado.');

    await this.repo.restore(id);
  }
}
