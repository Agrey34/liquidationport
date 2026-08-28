import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadOrderInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  invoiceBase64?: string;
}
