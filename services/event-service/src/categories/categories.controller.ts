import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ServiceAuthGuard, CurrentUser } from '@campuspulse/shared';

@Controller('categories')
@UseGuards(ServiceAuthGuard)
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser('role') role: string,
    @Body() dto: CreateCategoryDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.categoriesService.create(dto);
  }

  @Post('seed')
  seed(@CurrentUser('role') role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.categoriesService.seedDefaults();
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('role') role: string,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.categoriesService.remove(id);
  }
}
