import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : value,
  )
  @IsString()
  yearsOfExperience?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : value,
  )
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profileDetails?: string;

  @IsOptional()
  @IsEnum(['STREAM', 'WAVE'])
  schedulingType?: 'STREAM' | 'WAVE';
}
