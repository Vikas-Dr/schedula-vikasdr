import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorProfile } from '../doctor.entity';

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

@Entity({ name: 'recurring_availabilities' })
export class RecurringAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'day_of_week' })
  dayOfWeek!: string;

  @Column({ name: 'start_time' })
  startTime!: string;

  @Column({ name: 'end_time' })
  endTime!: string;

  @Column({ type: 'int', default: 1 })
  capacity!: number;

  @Column({ type: 'varchar', default: 'recurring' })
  type!: string; // 'recurring'

  @ManyToOne(() => DoctorProfile, (doctor) => doctor.recurringAvailabilities, {
    onDelete: 'CASCADE',
  })
  doctor!: DoctorProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
