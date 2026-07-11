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

  findAll(): Promise<Cliente[]> {
    return this.repo.find({ order: { id_clientes: 'ASC' } });
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
