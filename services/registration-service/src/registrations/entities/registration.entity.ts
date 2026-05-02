import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

export enum RegistrationStatus {
  CONFIRMED = 'confirmed',
  WAITLISTED = 'waitlisted',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'registrations', schema: 'registrations' })
@Unique(['eventId', 'userId'])
@Index(['eventId', 'status'])
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'event_id' })
  eventId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: RegistrationStatus.CONFIRMED })
  status: RegistrationStatus;

  @Column({ type: 'integer', name: 'waitlist_position', nullable: true })
  waitlistPosition: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'registered_at' })
  registeredAt: Date;
}
