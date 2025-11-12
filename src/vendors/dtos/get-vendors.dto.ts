import { IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetVendorsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId!: number;

  @IsString()
  areaSlug!: string;

  // optional if you ever want to make it dynamic; defaulting to egypt
  countrySlug: string = 'egypt';
}
