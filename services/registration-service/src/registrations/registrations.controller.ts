import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Inject,
  UseGuards,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ServiceAuthGuard, CurrentUser } from '@campuspulse/shared';

@Controller()
@UseGuards(ServiceAuthGuard)
export class RegistrationsController {
  constructor(
    @Inject(RegistrationsService) private readonly registrationsService: RegistrationsService,
  ) {}

  @Post('registrations')
  register(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRegistrationDto,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.registrationsService.register(userId, dto.eventId, token);
  }

  @Delete('registrations/:id')
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.registrationsService.cancel(id, userId, role);
  }

  @Get('registrations/me')
  myRegistrations(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.registrationsService.findMyRegistrations(userId, token);
  }

  @Get('registrations/event/:eventId/check')
  checkRegistration(
    @CurrentUser('id') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.registrationsService.checkRegistration(userId, eventId);
  }

  @Get('registrations/event/:eventId/roster')
  getRoster(
    @Param('eventId') eventId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role !== 'admin' && role !== 'organizer') {
      throw new ForbiddenException('Only admin/organizer can view rosters');
    }
    return this.registrationsService.findRoster(eventId);
  }
}
