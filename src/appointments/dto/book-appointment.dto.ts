import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookAppointmentDto {
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @IsNotEmpty()
  @IsString()
  date!: string; // Format: YYYY-MM-DD

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  availabilityId?: string;

  @IsOptional()
  @IsEnum(['STREAM', 'WAVE'])
  schedulingType?: 'STREAM' | 'WAVE';

  @IsOptional()
  @IsString()
  reason?: string;
}
