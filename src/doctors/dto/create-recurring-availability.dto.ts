import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRecurringAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  dayOfWeek!: string;

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;
}
