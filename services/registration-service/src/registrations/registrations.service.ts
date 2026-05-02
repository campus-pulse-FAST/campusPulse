import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Registration, RegistrationStatus } from './entities/registration.entity';

interface EventInfo {
  id: string;
  title: string;
  capacity: number;
  startTime: string;
  endTime: string;
  registrationDeadline: string | null;
  status: string;
}

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
    @Inject(HttpService)
    private httpService: HttpService,
    @Inject(ConfigService)
    private configService: ConfigService,
  ) {}

  private async fetchEvent(eventId: string, userToken: string): Promise<EventInfo> {
    const eventServiceUrl = this.configService.get('EVENT_SERVICE_URL', 'http://localhost:3002');
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${eventServiceUrl}/events/${eventId}`, {
          headers: {
            'X-Internal-Service-Key': this.configService.get('INTERNAL_SERVICE_KEY', ''),
            'X-User-Id': 'service',
            'X-User-Role': 'admin',
            Authorization: `Bearer ${userToken}`,
          },
          timeout: 5000,
        }),
      );
      const data = response.data?.data || response.data;
      return data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new NotFoundException('Event not found');
      }
      throw new BadRequestException('Could not verify event');
    }
  }

  private async fetchUser(userId: string): Promise<any> {
    const userServiceUrl = this.configService.get('USER_SERVICE_URL', 'http://localhost:3001');
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}/users/${userId}`, {
          headers: {
            'X-Internal-Service-Key': this.configService.get('INTERNAL_SERVICE_KEY', ''),
            'X-User-Id': 'service',
            'X-User-Role': 'admin',
          },
          timeout: 5000,
        }),
      );
      return response.data?.data || response.data;
    } catch {
      return { id: userId, name: 'Unknown', email: 'unknown' };
    }
  }

  async register(userId: string, eventId: string, userToken: string) {
    // Fetch event details (cross-service call)
    const event = await this.fetchEvent(eventId, userToken);

    // F6: Deadline enforcement
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (deadline < new Date()) {
        throw new BadRequestException('Registration deadline has passed');
      }
    }

    if (event.status !== 'published') {
      throw new BadRequestException('Event is not open for registration');
    }

    // Check duplicate
    const existing = await this.registrationsRepository.findOne({
      where: { eventId, userId },
    });
    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictException('Already registered for this event');
    }

    // F2: Capacity enforcement + F5: Waitlist FIFO
    const confirmedCount = await this.registrationsRepository.count({
      where: { eventId, status: RegistrationStatus.CONFIRMED },
    });

    let status: RegistrationStatus;
    let waitlistPosition: number | null = null;

    if (confirmedCount < event.capacity) {
      status = RegistrationStatus.CONFIRMED;
    } else {
      status = RegistrationStatus.WAITLISTED;
      const lastWaitlisted = await this.registrationsRepository
        .createQueryBuilder('r')
        .where('r.event_id = :eventId', { eventId })
        .andWhere('r.status = :status', { status: RegistrationStatus.WAITLISTED })
        .orderBy('r.waitlist_position', 'DESC')
        .getOne();
      waitlistPosition = (lastWaitlisted?.waitlistPosition || 0) + 1;
    }

    let registration: Registration;
    if (existing) {
      existing.status = status;
      existing.waitlistPosition = waitlistPosition;
      existing.registeredAt = new Date();
      registration = await this.registrationsRepository.save(existing);
    } else {
      registration = this.registrationsRepository.create({
        eventId,
        userId,
        status,
        waitlistPosition,
      });
      registration = await this.registrationsRepository.save(registration);
    }

    return {
      ...registration,
      event: {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
      },
    };
  }

  async cancel(registrationId: string, userId: string, role: string) {
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
    });

    if (!registration) throw new NotFoundException('Registration not found');

    if (role !== 'admin' && registration.userId !== userId) {
      throw new BadRequestException('You can only cancel your own registration');
    }

    const wasConfirmed = registration.status === RegistrationStatus.CONFIRMED;
    registration.status = RegistrationStatus.CANCELLED;
    await this.registrationsRepository.save(registration);

    // F5: Waitlist promotion (FIFO) — promote next waitlisted user
    if (wasConfirmed) {
      const nextWaitlisted = await this.registrationsRepository
        .createQueryBuilder('r')
        .where('r.event_id = :eventId', { eventId: registration.eventId })
        .andWhere('r.status = :status', { status: RegistrationStatus.WAITLISTED })
        .orderBy('r.waitlist_position', 'ASC')
        .getOne();

      if (nextWaitlisted) {
        nextWaitlisted.status = RegistrationStatus.CONFIRMED;
        nextWaitlisted.waitlistPosition = null;
        await this.registrationsRepository.save(nextWaitlisted);
      }
    }

    return { cancelled: true, registrationId };
  }

  async findMyRegistrations(userId: string, userToken: string) {
    const registrations = await this.registrationsRepository.find({
      where: { userId },
      order: { registeredAt: 'DESC' },
    });

    // Enrich with event details (F8: Participation History)
    const enriched = await Promise.all(
      registrations.map(async (r) => {
        try {
          const event = await this.fetchEvent(r.eventId, userToken);
          return { ...r, event };
        } catch {
          return { ...r, event: null };
        }
      }),
    );

    return enriched;
  }

  async findRoster(eventId: string) {
    // F3: Automated Roster Generation
    const registrations = await this.registrationsRepository.find({
      where: { eventId },
      order: { status: 'ASC', waitlistPosition: 'ASC', registeredAt: 'ASC' },
    });

    // Enrich with user details
    const enriched = await Promise.all(
      registrations.map(async (r) => {
        const user = await this.fetchUser(r.userId);
        return {
          registrationId: r.id,
          status: r.status,
          waitlistPosition: r.waitlistPosition,
          registeredAt: r.registeredAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            semester: user.semester,
          },
        };
      }),
    );

    const confirmed = enriched.filter((r) => r.status === RegistrationStatus.CONFIRMED);
    const waitlisted = enriched.filter((r) => r.status === RegistrationStatus.WAITLISTED);
    const cancelled = enriched.filter((r) => r.status === RegistrationStatus.CANCELLED);

    return {
      eventId,
      summary: {
        confirmed: confirmed.length,
        waitlisted: waitlisted.length,
        cancelled: cancelled.length,
        total: enriched.length,
      },
      confirmed,
      waitlisted,
      cancelled,
    };
  }

  async checkRegistration(userId: string, eventId: string) {
    const registration = await this.registrationsRepository.findOne({
      where: { userId, eventId },
    });
    return registration || null;
  }
}
