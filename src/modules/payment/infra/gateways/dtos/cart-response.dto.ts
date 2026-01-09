import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartItemDto {
  @IsString({ message: 'O SKU deve ser uma string' })
  sku: string;

  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @Min(1, { message: 'A quantidade deve ser maior que zero' })
  quantity: number;

  @IsNumber({}, { message: 'O preço unitário deve ser um número' })
  @Min(0, { message: 'O preço unitário não pode ser negativo' })
  unitPrice: number;
}

export class CartResponseDto {
  @IsNumber({}, { message: 'O total de itens deve ser um número' })
  @Min(0, { message: 'O total de itens não pode ser negativo' })
  totalItems: number;

  @IsNumber({}, { message: 'O valor total deve ser um número' })
  @Min(0, { message: 'O valor total não pode ser negativo' })
  totalValue: number;

  @IsArray({ message: 'Os itens devem ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

