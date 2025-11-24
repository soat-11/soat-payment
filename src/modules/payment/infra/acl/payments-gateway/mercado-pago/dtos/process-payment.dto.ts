import { ApiProperty } from "@nestjs/swagger";

export class ProcessPaymentDTOSchemaRequest {
   @ApiProperty({
    description: "Action",
    example: "payment.created",
  })
  action: string;

  @ApiProperty({
    description: "API version",
    example: "2023-10-17",
  })
  api_version: string;

  @ApiProperty({
    description: "Application ID",
    example: "app_1234567890",
  })
  application_id: string;

  @ApiProperty({
    description: "Date created",
    example: "2023-10-17T12:34:56Z",
  })
  date_created: string;

  @ApiProperty({
    description: "ID",
    example: "evt_1234567890",
  })
  id: string;

  @ApiProperty({
    description: "Live mode",
    example: true,
  })
  live_mode: boolean;

  @ApiProperty({
    description: "Type",
    example: "payment.succeeded",
  })
  type: string;

  @ApiProperty({
    description: "User ID",
    example: 123456,
  })
  user_id: number;

  @ApiProperty({
    description: "Data",
    type: Object,
    example: { id: "data_1234567890" },
  })
  data: { id: string };
}