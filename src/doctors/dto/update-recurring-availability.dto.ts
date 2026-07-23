import { IsOptional, IsString } from 'class-validator';

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
}
