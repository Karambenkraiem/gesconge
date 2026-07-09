import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../users/user.entity';
import { ApiTags } from '@nestjs/swagger';

class SetDemoModeDto {
  @IsBoolean() enabled: boolean;
}

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // Public: the login page needs to read this without being authenticated.
  @Get('demo-mode')
  getDemoMode() {
    return this.settingsService.getDemoMode();
  }

  @Put('demo-mode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  setDemoMode(@Body() dto: SetDemoModeDto) {
    return this.settingsService.setDemoMode(dto.enabled);
  }
}
