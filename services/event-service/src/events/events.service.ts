import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { VenuesService } from '../venues/venues.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @Inject(forwardRef(() => VenuesService))
    private venuesService: VenuesService,
  ) {}

  async create(organizerId: string, dto: CreateEventDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // F1: Venue Conflict Checker
    if (dto.venueId) {
      await this.venuesService.assertNoConflict(dto.venueId, startTime, endTime);
    }

    const event = this.eventsRepository.create({
      ...dto,
      organizerId,
      startTime,
      endTime,
      registrationDeadline: dto.registrationDeadline
        ? new Date(dto.registrationDeadline)
        : null,
    });
    return this.eventsRepository.save(event);
  }

  async findAll(query: ListEventsDto, userRole: string) {
    const { page = 1, limit = 20, categoryId, search, fromDate, toDate, status, isPublic } = query;

    const where: FindOptionsWhere<Event> = {};

    // Role-based filtering: students/organizers see only published+public
    if (userRole !== 'admin') {
      where.status = EventStatus.PUBLISHED;
      where.isPublic = true;
    } else {
      if (status) where.status = status;
      if (isPublic !== undefined) where.isPublic = isPublic;
    }

    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = ILike(`%${search}%`);

    // F19: Date range search
    if (fromDate && toDate) {
      where.startTime = Between(new Date(fromDate), new Date(toDate));
    } else if (fromDate) {
      where.startTime = MoreThanOrEqual(new Date(fromDate));
    } else if (toDate) {
      where.startTime = LessThanOrEqual(new Date(toDate));
    }

    const [events, total] = await this.eventsRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { startTime: 'ASC' },
    });

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userRole: string) {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (userRole !== 'admin') {
      if (event.status !== EventStatus.PUBLISHED || !event.isPublic) {
        throw new NotFoundException('Event not found');
      }
    }

    return event;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateEventDto) {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (userRole !== 'admin' && event.organizerId !== userId) {
      throw new ForbiddenException('You can only edit your own events');
    }

    const newStartTime = dto.startTime ? new Date(dto.startTime) : event.startTime;
    const newEndTime = dto.endTime ? new Date(dto.endTime) : event.endTime;
    const newVenueId = dto.venueId !== undefined ? dto.venueId : event.venueId;

    if (newStartTime >= newEndTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // F1: Re-check venue conflict if venue/time changed
    const venueChanged = dto.venueId !== undefined && dto.venueId !== event.venueId;
    const timeChanged = !!(dto.startTime || dto.endTime);
    if (newVenueId && (venueChanged || timeChanged)) {
      await this.venuesService.assertNoConflict(newVenueId, newStartTime, newEndTime, id);
    }

    Object.assign(event, {
      ...dto,
      startTime: newStartTime,
      endTime: newEndTime,
      ...(dto.registrationDeadline && {
        registrationDeadline: new Date(dto.registrationDeadline),
      }),
    });

    return this.eventsRepository.save(event);
  }

  async remove(id: string, userRole: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    event.status = EventStatus.CANCELLED;
    return this.eventsRepository.save(event);
  }
}
