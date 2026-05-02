import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { ServiceAuthGuard, CurrentUser } from '@campuspulse/shared';

@Controller('events')
@UseGuards(ServiceAuthGuard)
export class EventsController {
  constructor(@Inject(EventsService) private readonly eventsService: EventsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateEventDto,
  ) {
    if (role !== 'admin' && role !== 'organizer') {
      throw new ForbiddenException('Only admins or organizers can create events');
    }
    return this.eventsService.create(userId, dto);
  }

  @Get()
  findAll(
    @Query() query: ListEventsDto,
    @CurrentUser('role') role: string,
  ) {
    return this.eventsService.findAll(query, role);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
  ) {
    return this.eventsService.findOne(id, role);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, userId, role, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
  ) {
    return this.eventsService.remove(id, role);
  }
}
