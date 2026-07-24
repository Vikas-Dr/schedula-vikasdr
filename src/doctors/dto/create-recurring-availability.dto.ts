import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRecurringAvailabilityDto {
  @IsOptional()
  dayOfWeek?: string | string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysOfWeek?: string[];

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(['STREAM', 'WAVE'])
  schedulingType?: 'STREAM' | 'WAVE';

  @IsOptional()
  @IsInt()
  @Min(1)
  slotDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  type?: string;
}
