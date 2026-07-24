import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';

@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  date!: string; // Format: YYYY-MM-DD

  @Column({ name: 'start_time' })
  startTime!: string;

  @Column({ name: 'end_time' })
  endTime!: string;

  @Column({ name: 'scheduling_type', type: 'varchar', default: 'STREAM' })
  schedulingType!: 'STREAM' | 'WAVE';

  @Column({ name: 'token_number', type: 'int', nullable: true })
  tokenNumber?: number;

  @Column({ type: 'varchar', default: 'CONFIRMED' })
  status!: string; // 'CONFIRMED' | 'CANCELLED'

  @Column({ nullable: true })
  reason?: string;

  @Column({ name: 'availability_id', nullable: true })
  availabilityId?: string;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  doctor!: DoctorProfile;

  @ManyToOne(() => PatientProfile, { onDelete: 'CASCADE' })
  patient!: PatientProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
