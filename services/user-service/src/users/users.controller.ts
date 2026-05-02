import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  Query,
  Inject,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ServiceAuthGuard, CurrentUser } from '@campuspulse/shared';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(ServiceAuthGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findMe(userId);
  }

  @Put('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(userId, updateDto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
  ) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    if (id === currentUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser('role') role?: string,
  ) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.findAll(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }
}
