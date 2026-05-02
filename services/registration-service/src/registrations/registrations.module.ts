import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { Registration } from './entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration]),
    HttpModule.register({ timeout: 5000 }),
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
