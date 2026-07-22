import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'doctor_profiles' })
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  specialization?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ name: 'qualification', nullable: true })
  qualification?: string;

  @Column({ name: 'years_of_experience', nullable: true })
  yearsOfExperience?: string;

  @Column({ name: 'fee', nullable: true })
  fee?: string;

  @Column({ name: 'availability', nullable: true })
  availability?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
