import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Venue } from '../../venues/entities/venue.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'events', schema: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', name: 'organizer_id' })
  organizerId: string;

  @Column({ type: 'integer', name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'integer', name: 'venue_id', nullable: true })
  venueId: number;

  @ManyToOne(() => Venue, { eager: true, nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column({ type: 'timestamptz', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamptz', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'integer' })
  capacity: number;

  @Column({ type: 'varchar', length: 20, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column({ type: 'boolean', name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ type: 'timestamptz', name: 'registration_deadline', nullable: true })
  registrationDeadline: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
