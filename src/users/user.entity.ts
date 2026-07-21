import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';

export type UserRole = 'doctor' | 'patient';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ type: 'varchar', default: 'patient' })
  role: UserRole;

  @OneToOne(() => DoctorProfile, (doctor) => doctor.user, {
    cascade: true,
    nullable: true,
  })
  doctorProfile?: DoctorProfile;

  @OneToOne(() => PatientProfile, (patient) => patient.user, {
    cascade: true,
    nullable: true,
  })
  patientProfile?: PatientProfile;
}
