import { IsDecimal, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // @IsString()
  // @IsNotEmpty()
  // phone: string;

  // @IsString()
  // @IsNotEmpty()
  // address: string;

  @IsDecimal()
  @IsNotEmpty()
  latitude: string;

  @IsDecimal()
  @IsNotEmpty()
  longitude: string;

  // @IsNumber()
  // @IsNotEmpty()
  // avgPrice: number;

  // @IsNumber()
  // @IsNotEmpty()
  // avgPriceLevel: number;

  @IsDecimal()
  @IsNotEmpty()
  rating: number;

  // @IsObject()
  // @IsNotEmpty()
  // @ValidateNested()
  // @Type(() => Object)
  // openingHours: Record<string, string>;

  // @IsString()
  // @IsNotEmpty()
  // website: string;

  @IsNumber()
  @IsNotEmpty()
  areaId: number;
}
