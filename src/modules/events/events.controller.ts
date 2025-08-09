import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Patch } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
        fileIsRequired: false, // Tùy chọn: file không bắt buộc
      }),
    ) file: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
    @Request() req,
  ) {
    return this.eventsService.create(createEventDto, req.user.sub, req.user.role, file);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  findAllForAdmin(@Query() query: any, @Request() req) {
    return this.eventsService.findAllForAdmin(query, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
        fileIsRequired: false, // Tùy chọn: file không bắt buộc
      }),
    ) file: Express.Multer.File,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ) {
  return this.eventsService.update(id, updateEventDto, req.user.sub, req.user.role, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id, req.user.role);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  getEventStats(@Query() query: any, @Request() req) {
    return this.eventsService.getEventStats(query, req.user.role);
  }
}