import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRecurringAvailabilityDto {
  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['stream', 'wave', 'recurring'])
  type?: 'stream' | 'wave' | 'recurring';
}
