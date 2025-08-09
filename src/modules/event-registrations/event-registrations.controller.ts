import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EventRegistrationsService } from './event-registrations.service';
import { RegisterEventDto } from './dto/register-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegistrationStatus, Role } from '@prisma/client';

@Controller('event-registrations')
@UseGuards(JwtAuthGuard)
export class EventRegistrationsController {
  constructor(
    private readonly eventRegistrationsService: EventRegistrationsService,
  ) {}

  @Post('events/:eventId/register')
  async registerForEvent(
    @Param('eventId') eventId: string,
    @Body() registerDto: RegisterEventDto,
    @Request() req: any,
  ) {
    return this.eventRegistrationsService.registerForEvent(
      eventId,
      req.user.sub,
      registerDto,
    );
  }

  @Get('my-registrations')
  async getMyRegistrations(@Request() req: any) {
    return this.eventRegistrationsService.getUserRegistrations(req.user.sub);
  }

  @Get('events/:eventId')
  @UseGuards(RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  async getEventRegistrations(@Param('eventId') eventId: string, @Request() req: any) {
    return this.eventRegistrationsService.getEventRegistrations(eventId, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  async updateRegistrationStatus(
    @Param('id') id: string,
    @Body('status') status: RegistrationStatus,
    @Request() req: any,
  ) {
    return this.eventRegistrationsService.updateRegistrationStatus(
      id,
      status,
      req.user.role,
    );
  }

  @Patch(':id/cancel')
  async cancelRegistration(@Param('id') id: string, @Request() req: any) {
    return this.eventRegistrationsService.cancelRegistration(id, req.user.sub);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  async getRegistrationStats(@Query('eventId') eventId?: string) {
    return this.eventRegistrationsService.getRegistrationStats(eventId);
  }
}
