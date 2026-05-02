import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Between, LessThan, MoreThan } from 'typeorm';
import { Venue } from './entities/venue.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private venuesRepository: Repository<Venue>,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  async create(dto: CreateVenueDto) {
    const venue = this.venuesRepository.create(dto);
    return this.venuesRepository.save(venue);
  }

  async findAll() {
    return this.venuesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const venue = await this.venuesRepository.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async update(id: number, dto: UpdateVenueDto) {
    const venue = await this.findOne(id);
    Object.assign(venue, dto);
    return this.venuesRepository.save(venue);
  }

  async remove(id: number) {
    const venue = await this.findOne(id);
    return this.venuesRepository.remove(venue);
  }

  /**
   * F1: Venue Conflict Checker
   * Returns conflicting events that overlap with the given time range at the same venue.
   * Two ranges [a,b] and [c,d] overlap if: a < d AND c < b
   * Excludes events with status 'cancelled' or 'archived'.
   * Optionally excludes a specific event ID (for updates).
   */
  async findConflicts(
    venueId: number,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string,
  ): Promise<Event[]> {
    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.venue_id = :venueId', { venueId })
      .andWhere('event.status NOT IN (:...excluded)', {
        excluded: [EventStatus.CANCELLED, EventStatus.ARCHIVED],
      })
      .andWhere('event.start_time < :endTime', { endTime })
      .andWhere('event.end_time > :startTime', { startTime });

    if (excludeEventId) {
      qb.andWhere('event.id != :excludeEventId', { excludeEventId });
    }

    return qb.getMany();
  }

  /**
   * Checks for conflicts and throws ConflictException if any are found.
   */
  async assertNoConflict(
    venueId: number,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string,
  ): Promise<void> {
    const conflicts = await this.findConflicts(venueId, startTime, endTime, excludeEventId);
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Venue is already booked for this time slot',
        conflictingEvents: conflicts.map((e) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
        })),
      });
    }
  }

  /**
   * Returns booked time slots for a venue on a given date.
   */
  async getAvailability(venueId: number, date: string) {
    const venue = await this.findOne(venueId);

    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const bookings = await this.eventsRepository.find({
      where: {
        venueId,
        status: Not(EventStatus.CANCELLED),
        startTime: Between(dayStart, dayEnd),
      },
      order: { startTime: 'ASC' },
    });

    return {
      venue: {
        id: venue.id,
        name: venue.name,
        capacity: venue.capacity,
      },
      date,
      bookings: bookings.map((b) => ({
        eventId: b.id,
        title: b.title,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      })),
    };
  }
}
