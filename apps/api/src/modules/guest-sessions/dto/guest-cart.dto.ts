import {
  IsInt,
  IsUUID,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class AddGuestCartItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdateGuestCartItemDto {
  @IsInt()
  @Min(0)
  @Max(99)
  quantity: number;
}

export class MergeGuestSessionDto {
  /** The raw guest session token from the HttpOnly cookie — extracted server-side, not from the body */
  @IsOptional()
  guestToken?: string;
}
