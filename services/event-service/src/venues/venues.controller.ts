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
  ParseIntPipe,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { ServiceAuthGuard, CurrentUser } from '@campuspulse/shared';

@Controller('venues')
@UseGuards(ServiceAuthGuard)
export class VenuesController {
  constructor(@Inject(VenuesService) private readonly venuesService: VenuesService) {}

  @Get()
  findAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.venuesService.findOne(id);
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ) {
    return this.venuesService.getAvailability(id, date);
  }

  @Post()
  create(
    @CurrentUser('role') role: string,
    @Body() dto: CreateVenueDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.venuesService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateVenueDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.venuesService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('role') role: string,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.venuesService.remove(id);
  }
}
