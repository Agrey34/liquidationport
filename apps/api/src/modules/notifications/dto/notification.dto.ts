import { IsString, IsNotEmpty, IsEnum, IsUUID } from 'class-validator';

export enum NotificationType {
  order_created = 'order_created',
  order_paid = 'order_paid',
  order_shipped = 'order_shipped',
  order_delivered = 'order_delivered',
  system = 'system',
  promotion = 'promotion'
}

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
