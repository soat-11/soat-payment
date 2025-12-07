import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsString } from 'class-validator';

export class ProcessPaymentDTOSchemaRequest {
  @ApiProperty({
    description: 'Action',
    example: 'payment.created',
  })
  @IsString()
  action: string;

  @ApiProperty({
    description: 'API version',
    example: '2023-10-17',
  })
  @IsString()
  api_version: string;

  @ApiProperty({
    description: 'Application ID',
    example: 'app_1234567890',
  })
  @IsString()
  application_id: string;

  @ApiProperty({
    description: 'Date created',
    example: '2023-10-17T12:34:56Z',
  })
  @IsString()
  date_created: string;

  @ApiProperty({
    description: 'ID',
    example: 'evt_1234567890',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Live mode',
    example: true,
  })
  @IsBoolean()
  live_mode: boolean;

  @ApiProperty({
    description: 'Type',
    example: 'payment.succeeded',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'User ID',
    example: 123456,
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'Data',
    type: Object,
    example: { id: 'data_1234567890' },
  })
  @IsObject()
  data: { id: string };
}
