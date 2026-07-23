import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomOverrideDto {
  @IsNotEmpty()
  @IsString()
  date!: string;

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
