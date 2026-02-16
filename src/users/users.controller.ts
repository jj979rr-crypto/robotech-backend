import {Controller,Patch,Param,UseGuards,ForbiddenException,Request,NotFoundException,Post,Body
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. DESBLOQUEAR STAFF (Solo el Admin puede hacerlo)
  @Patch(':id/unlock-staff')
  @UseGuards(AuthGuard('jwt'))
  async unlockStaff(@Param('id') id: string, @Request() req) {
    const requesterId = req.user?.sub ?? req.user?.id;
    if (!requesterId) {
      throw new ForbiddenException('No se pudo identificar al usuario.');
    }

    return this.usersService.unlockStaffByAdmin(requesterId, id);
  }

  // 2. DESBLOQUEAR COMPETIDOR (Admin o Dueño del Club)
  @Patch(':id/unlock-competitor')
  @UseGuards(AuthGuard('jwt'))
  async unlockCompetitor(@Param('id') id: string, @Request() req) {
  console.log('[unlockCompetitor] req.user =', req.user);
  const requesterId = req.user?.sub ?? req.user?.id;
    if (!requesterId) {
      throw new ForbiddenException('No se pudo identificar al usuario.');
    }

    return this.usersService.unlockCompetitorByOwnerOrAdmin(requesterId, id);
  }
  // 3. CREAR JUEZ (Solo el Admin puede hacerlo)
  @Post('create-judge')
  @UseGuards(AuthGuard('jwt'))
  async createJudge(@Body() body: { email: string; password: string }, @Request() req) {
    const requesterId = req.user?.sub ?? req.user?.id;
    
      if (!requesterId) {
        throw new ForbiddenException('No se pudo identificar al usuario.');
      }
      return this.usersService.createJudge(requesterId, body.email, body.password);
  }
}