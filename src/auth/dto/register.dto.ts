import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(['doctor', 'patient'])
  role: 'doctor' | 'patient';

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  experienceYears?: string;

  @IsOptional()
  @IsString()
  fees?: string;

  @IsOptional()
  @IsString()
  birthday?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
