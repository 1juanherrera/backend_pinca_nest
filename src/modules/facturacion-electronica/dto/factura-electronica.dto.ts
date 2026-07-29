import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Catálogo DIAN de impuestos (solo los que usamos hoy). '01' = IVA. */
export class TaxDto {
  @IsString() @MaxLength(2)
  code: string;

  @IsNumberString()
  rate: string;
}

/**
 * Ítem de factura/nota. `unit_measure_code` y `standard_code` tienen fallback a
 * '94' (otra unidad) / '999' (sin clasificar) — validado en sandbox: alcanza para
 * que el DIAN valide el documento sin mapear cada producto a UNSPSC real.
 */
export class ItemFacturaElectronicaDto {
  @IsString() @MaxLength(50)
  code_reference: string;

  @IsString() @MaxLength(255)
  name: string;

  @IsNumberString()
  quantity: string;

  @IsNumberString()
  price: string;

  @IsOptional() @IsNumberString()
  discount_rate?: string;

  @IsOptional() @IsString() @MaxLength(10)
  unit_measure_code?: string;

  @IsOptional() @IsString() @MaxLength(10)
  standard_code?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxDto)
  taxes: TaxDto[];
}

export class PaymentDetailDto {
  @IsIn([1, 2])
  payment_form: number;

  @IsString() @MaxLength(2)
  payment_method_code: string;

  @IsOptional() @IsString() @MaxLength(50)
  reference_code?: string;

  @IsNumberString()
  amount: string;

  @IsOptional() @IsString()
  due_date?: string;
}

/** Cliente (factura/nota crédito/débito) — shape `customer` de Factus. */
export class CustomerFacturaElectronicaDto {
  @IsString() @MaxLength(2)
  identification_document_code: string;

  @IsString() @MaxLength(20)
  identification: string;

  @IsOptional() @IsString() @MaxLength(255)
  company?: string;

  @IsOptional() @IsString() @MaxLength(255)
  trade_name?: string;

  @IsOptional() @IsString() @MaxLength(255)
  names?: string;

  @IsOptional() @IsString() @MaxLength(255)
  address?: string;

  @IsOptional() @IsString() @MaxLength(100)
  email?: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @IsIn(['1', '2'])
  legal_organization_code: string;

  @IsString() @MaxLength(4)
  tribute_code: string;

  @IsOptional() @IsString() @MaxLength(2)
  country_code?: string;

  @IsString() @MaxLength(10)
  municipality_code: string;
}

export class CrearFacturaElectronicaDto {
  /** Idempotencia hacia Factus. Si no viene, el service genera una a partir de PINCA. */
  @IsOptional() @IsString() @MaxLength(50)
  reference_code?: string;

  /** Si no viene, el service usa FACTUS_NUMBERING_RANGE_FACTURA del .env. */
  @IsOptional() @IsInt() @IsPositive()
  numbering_range_id?: number;

  @IsOptional() @IsString() @MaxLength(2)
  operation_type?: string;

  @IsOptional() @IsString()
  observation?: string;

  /** Factus lo exige siempre (al menos un detalle de pago), no es opcional. */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  payment_details: PaymentDetailDto[];

  @ValidateNested()
  @Type(() => CustomerFacturaElectronicaDto)
  customer: CustomerFacturaElectronicaDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemFacturaElectronicaDto)
  items: ItemFacturaElectronicaDto[];
}

export class CrearNotaCreditoElectronicaDto {
  @IsOptional() @IsString() @MaxLength(50)
  reference_code?: string;

  /** Código de concepto de corrección DIAN (ej. '1' devolución, '2' anulación...). */
  @IsString() @MaxLength(2)
  correction_concept_code: string;

  /** Número de factura ELECTRÓNICA (el que asignó Factus, ej. "SETP990014019"). */
  @IsString() @MaxLength(30)
  bill_number: string;

  @IsOptional() @IsInt() @IsPositive()
  numbering_range_id?: number;

  @IsOptional() @IsString()
  observation?: string;

  /** Factus lo exige siempre (al menos un detalle de pago), no es opcional. */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  payment_details: PaymentDetailDto[];

  @ValidateNested()
  @Type(() => CustomerFacturaElectronicaDto)
  customer: CustomerFacturaElectronicaDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemFacturaElectronicaDto)
  items: ItemFacturaElectronicaDto[];
}
