import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'doctor_profiles' })
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  specialization?: string;

  @Column({ nullable: true })
  experienceYears?: string;

  @Column({ nullable: true })
  fees?: string;

  @Column({ default: false })
  verified: boolean;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
