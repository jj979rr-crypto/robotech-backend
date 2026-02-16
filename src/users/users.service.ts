import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, StaffType } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      await this.userRepository.save(user);
      const { password: _, ...result } = user;
      return result;

    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException();
    }
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOne({ 
      where: { email },
      relations: ['clubProfile', 'competitorProfile'] 
    });
  }

  async findOneById(id: string) {
    return this.userRepository.findOne({ 
      where: { id },
      relations: ['clubProfile', 'competitorProfile'] 
    });
  }

  async setTwoFactorSecret(userId: string, secret: string | null) {
    return this.userRepository.update(userId, { 
      twoFactorSecret: secret 
    });
  }

  // --- LÓGICA DE INTENTOS FALLIDOS ---

  async resetLoginAttempts(user: User) {
    user.loginAttempts = 0;
    return this.userRepository.save(user);
  }

  async incrementLoginAttempts(user: User) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= 5) {
      user.isLocked = true;
    }

    return this.userRepository.save(user);
  }

  async unlockUser(userId: string) {
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.loginAttempts = 0;
    user.isLocked = false;
    
    return this.userRepository.save(user);
  }

  // 🔓 Desbloquear STAFF (solo ADMIN)
  async unlockStaffByAdmin(requesterId: string, targetUserId: string) {
    const requester = await this.findOneById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo el administrador puede desbloquear STAFF.');
    }

    const targetUser = await this.findOneById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario a desbloquear no encontrado');
    }

    if (targetUser.role === UserRole.COMPETITOR) {
      throw new ForbiddenException(
        'Usa el endpoint de competidores para este usuario.',
      );
    }

    return this.unlockUser(targetUserId);
  }

  // 🔓 Desbloquear COMPETIDOR
  async unlockCompetitorByOwnerOrAdmin(
    requesterId: string,
    competitorUserId: string,
  ) {
    console.log('🔹 unlockCompetitorByOwnerOrAdmin CALLED');
    try {
      const requester = await this.findOneById(requesterId);
      if (!requester) throw new NotFoundException('Usuario solicitante no encontrado');

      if (requester.role === UserRole.COMPETITOR) {
        throw new ForbiddenException('No tienes permisos para desbloquear competidores.');
      }

      const target = await this.findOneById(competitorUserId);
      if (!target) throw new NotFoundException('Usuario a desbloquear no encontrado');

      if (target.role !== UserRole.COMPETITOR) {
        throw new ForbiddenException('Solo se pueden desbloquear usuarios de tipo competidor.');
      }

      return this.unlockUser(competitorUserId);
    } catch (err) {
      console.error('💥 ERROR en unlockCompetitorByOwnerOrAdmin:', err);
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Error al desbloquear competidor');
    }
  }

  // ✅ NUEVO MÉTODO: CREAR JUEZ
  // Se encarga de la lógica que faltaba para el error "Cannot POST"
  async createJudge(requesterId: string, email: string, pass: string) {
    // 1. Validar que quien pide sea Admin
    const requester = await this.findOneById(requesterId);
    if (!requester || requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear jueces.');
    }

    // 2. Validar si ya existe el correo
    const existingUser = await this.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // 3. Crear el Juez
    const hashedPassword = await bcrypt.hash(pass, 10);

    const newJudge = this.userRepository.create({
      email: email,
      password: hashedPassword,
      role: UserRole.JUDGE, // Asegúrate de tener 'JUDGE' en tu enum UserRole
      // Datos dummy para cumplir con la entidad (puedes ajustarlos)
      nombres: 'Juez',
      apellidos: 'Torneo',
      dni: '00000000', 
      isLocked: false,
      loginAttempts: 0,
    });

    return this.userRepository.save(newJudge);
  }

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}