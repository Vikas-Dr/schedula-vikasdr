import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'patient_profiles' })
export class PatientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  birthday?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  bloodType?: string;

  @Column({ nullable: true })
  emergencyContact?: string;

  @OneToOne(() => User, (user) => user.patientProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
