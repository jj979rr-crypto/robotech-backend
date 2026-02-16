import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterClubDto } from './register-club.dto';
import { RegisterCompetitorDto } from './register-competitor.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.authService.login(user);
  }

  @Post('register-club')
  registerClub(@Body() registerClubDto: RegisterClubDto) {
    return this.authService.registerClubOwner(registerClubDto);
  }

  @Post('register-competitor')
  registerCompetitor(@Body() dto: RegisterCompetitorDto) {
    return this.authService.registerCompetitor(dto);
  }

  @Post('verify-2fa')
  verify2fa(@Body() body: { userId: string; code: string }) {
    return this.authService.verify2fa(body.userId, body.code);
  }

  // 1. SOLICITUD DE CÓDIGO (BACKEND DEBE DEVOLVER { userId })
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    // Nota: El servicio debe enviar el código al correo y devolver el userId
    return this.authService.forgotPassword(body.email); 
  }

  // 2. NUEVO: VERIFICACIÓN DEL CÓDIGO DE RECUPERACIÓN (Paso 2 del Frontend)
  @Post('verify-reset-code')
  async verifyResetCode(@Body() body: { userId: string; code: string }) {
    return this.authService.verifyResetCode(body.userId, body.code);
  }
  
  // 3. NUEVO: CAMBIO DE CONTRASEÑA CON userId (Paso 3 del Frontend)
  // Usamos un endpoint diferente al anterior 'reset-password' para mayor claridad
  @Post('reset-password-on-app')
  async resetPasswordOnApp(@Body() body: { userId: string; newPassword: string }) {
    return this.authService.resetPasswordOnApp(body.userId, body.newPassword);
  }

  // NOTA: Dejamos el antiguo reset-password (basado en token URL) por si acaso lo usas en otro lugar.
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('resend-2fa')
  async resend2fa(@Body() body: { userId: string }) {
    const { userId } = body;

    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }

    return this.authService.resendTwoFactorCode(userId);
  }

}