import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorProfile } from '../doctor.entity';

@Entity({ name: 'custom_availabilities' })
export class CustomAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  date!: string; // Format: YYYY-MM-DD

  @Column({ name: 'start_time' })
  startTime!: string;

  @Column({ name: 'end_time' })
  endTime!: string;

  @Column({ name: 'is_available', default: true })
  isAvailable!: boolean;

  @ManyToOne(() => DoctorProfile, (doctor) => doctor.customAvailabilities, {
    onDelete: 'CASCADE',
  })
  doctor!: DoctorProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
