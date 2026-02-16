import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterClubDto } from './register-club.dto';
import { UserRole, StaffType } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Club, ClubStatus } from '../club/entities/club.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterCompetitorDto } from './register-competitor.dto';
import { Competitor } from '../competitor/entities/competitor.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Competitor)
    private competitorRepository: Repository<Competitor>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  // --- VALIDACIÓN DE USUARIO (MODIFICADO PARA BLOQUEO) ---
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    
    // 1. Si no existe el usuario, retornamos null (Credenciales inválidas)
    if (!user) return null;

    // 2. VERIFICAR SI YA ESTÁ BLOQUEADO ANTES DE COMPARAR CONTRASEÑA
    if (user.isLocked) {
      throw new UnauthorizedException('Tu cuenta está bloqueada. Contacta al dueño de tu club o al administrador.');
    }

    // 3. Comparar contraseña
    const isMatch = await bcrypt.compare(pass, user.password);

    if (isMatch) {
      // ÉXITO: Reseteamos el contador a 0
      await this.usersService.resetLoginAttempts(user);
      
      const { password, ...result } = user;
      return result;
    } else {
      // ERROR: Sumamos un intento fallido
      await this.usersService.incrementLoginAttempts(user);
      
      // Retornamos null para que Passport lance 401 Unauthorized
      // (Opcional: podrías lanzar una excepción aquí si quieres avisar "Te quedan X intentos")
      return null;
    }
  }

  // --- LOGIN ---
  async login(user: any) {
    // Si llegamos aquí, el usuario YA pasó por validateUser, 
    // así que sabemos que no está bloqueado y la contraseña es correcta.

    const requires2FA = 
      user.role === UserRole.STAFF && 
      (user.staffType === StaffType.CLUB_OWNER || user.staffType === StaffType.JUDGE);

    if (!requires2FA) {
      return this.generateAccessToken(user);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.setTwoFactorSecret(user.id, code);

    console.log('===================================================');
    console.log(`Código 2FA para ${user.email}: ${code}`);
    console.log('===================================================');

    try {
      await this.send2FACodeEmail(user.email, code);
    } catch (error) {
      console.error('Error enviando correo:', error.message);
    }

    return {
      message: 'Se requiere verificación.',
      require2fa: true,
      userId: user.id,
      role: user.role, 
      staffType: user.staffType 
    };
  }

  // --- NUEVO: Reenviar código 2FA ---
  async resendTwoFactorCode(userId: string) {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.isLocked) {
      throw new UnauthorizedException('Tu cuenta está BLOQUEADA.');
    }

    // Generamos un nuevo código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardamos el nuevo código en twoFactorSecret
    await this.usersService.setTwoFactorSecret(user.id, code);

    console.log('===================================================');
    console.log(`Nuevo código 2FA para ${user.email}: ${code}`);
    console.log('===================================================');

    try {
      await this.send2FACodeEmail(user.email, code);
    } catch (error) {
      console.error('Error reenviando correo 2FA:', error.message);
    }

    return {
      message: 'Nuevo código de verificación enviado al correo.',
    };
  }



  // --- 1. SOLICITUD DE CÓDIGO ---
  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    
    if (!user) {
      return { message: 'Si el correo existe, se ha enviado el código.' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date(Date.now() + 600000); 

    user.resetPasswordToken = resetCode; 
    user.resetPasswordExpires = resetTokenExpires;
    await this.userRepository.save(user);

    console.log(`===================================================`);
    console.log(`Código de Recuperación para ${user.email}: ${resetCode}`);
    console.log(`===================================================`);

    try {
      await this.sendResetCodeEmail(user.email, resetCode);
    } catch (error) {
      console.error('Error enviando correo de recuperación:', error);
    }

    return { 
      message: 'Código enviado.', 
      userId: user.id 
    }; 
  }
  
  // --- 2. VERIFICACIÓN DEL CÓDIGO DE RECUPERACIÓN ---
  async verifyResetCode(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    if (user.resetPasswordToken !== code) {
      throw new BadRequestException('El código ingresado es incorrecto.');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }
    
    return { message: 'Código verificado correctamente.' };
  }

  // --- 3. CAMBIO DE CLAVE FINAL ---
  async resetPasswordOnApp(userId: string, newPassword: string) {
    const user = await this.usersService.findOneById(userId);
    
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    
    if (!user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw new UnauthorizedException('El proceso de restablecimiento no está activo o ha expirado.');
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
       throw new BadRequestException(
         'La contraseña debe cumplir con los requisitos de seguridad.'
       );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Al cambiar contraseña, reseteamos intentos fallidos por seguridad/conveniencia
    await this.userRepository.update(user.id, {
        password: hashedPassword,
        resetPasswordToken: null, 
        resetPasswordExpires: null,
        loginAttempts: 0,     // <--- RESETEO EXTRA POR SI ACASO
        isLocked: false       // <--- DESBLOQUEO AUTOMÁTICO AL RECUPERAR
    });

    return { message: 'Contraseña actualizada correctamente.' };
  }

  // --- RECUPERACIÓN DE CONTRASEÑA (LEGACY) ---
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({ 
      where: { resetPasswordToken: token } 
    });

    if (!user) throw new BadRequestException('Token inválido o expirado.');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
       throw new BadRequestException(
         'La contraseña debe tener mín. 8 caracteres, incluir mayúsculas, minúsculas y símbolos.'
       );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    // También reseteamos aquí por si acaso
    user.loginAttempts = 0;
    user.isLocked = false;

    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada correctamente.' };
  }

  // --- HELPERS ---

  private generateAccessToken(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      staffType: user.staffType,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }


  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  
  async verify2fa(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');

    // Verificar bloqueo también aquí por seguridad
    if (user.isLocked) {
        throw new UnauthorizedException('Cuenta BLOQUEADA.');
    }

    if (user.twoFactorSecret !== code) {
      // Podrías contar esto como intento fallido también si quisieras ser muy estricto
      // await this.usersService.incrementLoginAttempts(user);
      throw new UnauthorizedException('El código ingresado es INCORRECTO.');
    }
    
    // Éxito 2FA
    await this.usersService.resetLoginAttempts(user);
    await this.usersService.setTwoFactorSecret(user.id, null);
    
    return this.generateAccessToken(user);
  }
  
  private async send2FACodeEmail(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: '🔐 Código de Verificación - Robotech',
      html: `
        <h3>Hola,</h3>
        <p>Tu código de verificación es:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
        <p>Este código expira en breve.</p>
      `,
    });
  }
  
  private async sendResetCodeEmail(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: '🔐 Código de Recuperación - Robotech',
      html: `
        <h3>Hola,</h3>
        <p>Tu código de recuperación es:</p>
        <h1 style="color: #007bff; letter-spacing: 5px;">${code}</h1>
        <p>Este código expira en 10 minutos.</p>
      `,
    });
  }
  
  // --- REGISTROS ---

  async registerClubOwner(dto: RegisterClubDto) {
    // ✅ Validar mayoría de edad
    const birth = new Date(dto.fechaNacimiento);
    if (isNaN(birth.getTime())) {
      throw new BadRequestException('Fecha de nacimiento inválida.');
    }
    const age = this.calculateAge(birth);
    if (age < 18) {
      throw new BadRequestException(
        'Debes ser mayor de edad para registrar un club.',
      );
    }

    // ✅ 1. Límite de 20 clubs
    const totalClubs = await this.clubRepository.count();
    if (totalClubs >= 20) {
      throw new ConflictException(
        'Se alcanzó el máximo de 20 clubes registrados en el sistema.',
      );
    }

    // ✅ 2. Correo único
    const existingUser = await this.usersService.findOneByEmail(dto.email);
    if (existingUser) throw new ConflictException('El correo ya está registrado');

    // 🆕 3. DNI único global (no se puede reutilizar en otro formulario)
    const existingUserByDni = await this.userRepository.findOne({
      where: { dni: dto.dni },
      select: ['id', 'role'],
    });
    if (existingUserByDni) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese DNI.',
      );
    }

    // ✅ 4. Reglas de contraseña
    if (dto.password === dto.dni) {
      throw new BadRequestException('La contraseña no puede ser igual al DNI.');
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(dto.password)) {
      throw new BadRequestException(
        'La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, un dígito y un carácter especial.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      role: UserRole.STAFF,
      staffType: StaffType.CLUB_OWNER,
      isActive: true,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
    });

    const newClub = this.clubRepository.create({
      nombre: dto.nombreClub,
      direccion: dto.direccion,
      descripcion: dto.descripcion,
      status: ClubStatus.PENDING,
      codigoInvitacion: `TEMP-${Math.floor(Math.random() * 10000)}`,
    });

    const savedUser = await this.userRepository.save(newUser);
    newClub.owner = savedUser;
    await this.clubRepository.save(newClub);

    return { message: 'Club registrado. Espere aprobación del administrador.' };
  }


  async registerCompetitor(dto: RegisterCompetitorDto) {
    // Mayoría de edad
    const birth = new Date(dto.fechaNacimiento);
    if (isNaN(birth.getTime())) {
      throw new BadRequestException('Fecha de nacimiento inválida.');
    }
    const age = this.calculateAge(birth);
    if (age < 18) {
      throw new BadRequestException('Debes ser mayor de edad para registrarte como competidor.');
    }

    // ✅ Normalizar nickname (para unicidad real)
    const nicknameNormalized = dto.nickname.trim().toLowerCase();

    // ✅ Correo único
    const existingUserByEmail = await this.usersService.findOneByEmail(dto.email);
    if (existingUserByEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    // ✅ DNI único global
    const existingUserByDni = await this.userRepository.findOne({
      where: { dni: dto.dni },
      select: ['id', 'role'],
    });
    if (existingUserByDni) {
      throw new ConflictException('Ya existe un usuario registrado con ese DNI.');
    }

    // ✅ Club válido por código de invitación
    const club = await this.clubRepository.findOne({
      where: { codigoInvitacion: dto.codigoInvitacion },
    });
    if (!club) {
      throw new ConflictException('El código de invitación no es válido.');
    }

    // ✅ Máximo 10 competidores por club
    const totalCompetidoresClub = await this.competitorRepository.count({
      where: { club: { id: club.id } },
    });
    if (totalCompetidoresClub >= 10) {
      throw new ConflictException('Este club ya tiene el máximo de 10 competidores registrados.');
    }

    // ✅ Nickname único global
    const existingNick = await this.competitorRepository.findOne({
      where: { nickname: nicknameNormalized },
      select: ['id'],
    });
    if (existingNick) {
      throw new ConflictException('El nickname ya está en uso');
    }

    // ✅ Reglas de contraseña
    if (dto.password === dto.dni) {
      throw new BadRequestException('La contraseña no puede ser igual al DNI.');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(dto.password)) {
      throw new BadRequestException(
        'La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, un dígito y un carácter especial.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      role: UserRole.COMPETITOR,
      isActive: true,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
    });

    const newCompetitor = this.competitorRepository.create({
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
      nickname: nicknameNormalized, // ✅ aquí SOLO una vez
      club: club,
    });

    const savedUser = await this.userRepository.save(newUser);
    newCompetitor.user = savedUser;

    try {
      await this.competitorRepository.save(newCompetitor);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.code === '23505') {
        throw new ConflictException('El nickname ya está en uso');
      }
      throw error;
    }

    return { message: '¡Registro exitoso! Ya eres parte del club ' + club.nombre };
  }
}