import { IsString, IsOptional, IsInt, Min, IsArray, MinLength } from 'class-validator';

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
