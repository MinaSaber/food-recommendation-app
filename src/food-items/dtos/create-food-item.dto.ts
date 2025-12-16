import {
  IsArray,
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFoodItemDto {
  @IsNumber()
  @IsNotEmpty()
  restaurantId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsDecimal()
  @IsNotEmpty()
  rating: number;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsArray()
  @IsNotEmpty()
  ingredients: string[];
}
