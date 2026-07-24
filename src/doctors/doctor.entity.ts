import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';

@Entity({ name: 'doctor_profiles' })
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  specialization?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ name: 'qualification', nullable: true })
  qualification?: string;

  @Column({ name: 'years_of_experience', nullable: true })
  yearsOfExperience?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @OneToMany(() => RecurringAvailability, (recurring) => recurring.doctor, {
    cascade: true,
  })
  recurringAvailabilities!: RecurringAvailability[];

  @OneToMany(() => CustomAvailability, (custom) => custom.doctor, {
    cascade: true,
  })
  customAvailabilities!: CustomAvailability[];
}
