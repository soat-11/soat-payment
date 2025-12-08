import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProcessPaymentDTOSchemaRequest {
  @ApiProperty({
    description:
      "Action (REQUIRED: must be 'payment.created' or 'payment.updated' to mark payment as paid)",
    example: 'payment.created',
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'API version',
    example: 'v1',
  })
  @IsString()
  @IsOptional()
  api_version?: string;

  @ApiProperty({
    description: 'Application ID',
    example: 'app_1234567890',
  })
  @IsString()
  @IsOptional()
  application_id?: string;

  @ApiProperty({
    description: 'Date created',
    example: '2023-10-17T12:34:56Z',
  })
  @IsString()
  @IsOptional()
  date_created?: string;

  @ApiProperty({
    description: 'ID',
    example: 'evt_1234567890',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Live mode',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  live_mode?: boolean;

  @ApiProperty({
    description: 'Type',
    example: 'payment',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'User ID',
    example: 123456,
  })
  @IsNumber()
  @IsOptional()
  user_id?: number;

  @ApiProperty({
    description: 'Data',
    type: Object,
    example: { id: 'data_1234567890' },
  })
  @IsObject()
  @IsOptional()
  data?: { id: string };
}