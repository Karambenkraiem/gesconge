import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.notifService.findForUser(req.user.userId);
  }

  @Get('unread-count')
  countUnread(@Request() req) {
    return this.notifService.countUnread(req.user.userId);
  }

  @Put(':id/lu')
  marquerLu(@Param('id') id: string, @Request() req) {
    return this.notifService.marquerLu(id, req.user.userId);
  }

  @Put('tout-lire')
  marquerTousLus(@Request() req) {
    return this.notifService.marquerTousLus(req.user.userId);
  }
}
