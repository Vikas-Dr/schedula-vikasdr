import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsNotEmpty()
  @IsString()
  newDate!: string; // Format: YYYY-MM-DD

  @IsOptional()
  @IsString()
  newStartTime?: string;

  @IsOptional()
  @IsString()
  newEndTime?: string;

  @IsOptional()
  @IsString()
  newAvailabilityId?: string;

  @IsOptional()
  @IsEnum(['STREAM', 'WAVE'])
  schedulingType?: 'STREAM' | 'WAVE';

  @IsOptional()
  @IsString()
  reason?: string;
}
