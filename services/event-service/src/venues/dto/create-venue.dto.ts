import { IsString, IsOptional, IsInt, Min, IsArray, MinLength } from 'class-validator';

export class CreateVenueDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
