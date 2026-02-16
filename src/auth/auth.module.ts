  import { Module } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { AuthController } from './auth.controller';
  import { UsersModule } from '../users/users.module';
  import { JwtModule } from '@nestjs/jwt';
  import { ConfigModule, ConfigService } from '@nestjs/config';
  import { TypeOrmModule } from '@nestjs/typeorm';
  import { Club } from '../club/entities/club.entity';
  import { User } from '../users/entities/user.entity';
  import { Competitor } from '../competitor/entities/competitor.entity';
  import { PassportModule } from '@nestjs/passport';
  import { JwtStrategy } from './jwt.strategy';

  @Module({
    imports: [
      TypeOrmModule.forFeature([Club, User, Competitor]),
      UsersModule,

      // 👇 Registramos Passport y definimos 'jwt' como estrategia por defecto
      PassportModule.register({ defaultStrategy: 'jwt' }),

      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret:
            configService.get<string>('JWT_SECRET') ||
            'ESTA_ES_MI_PALABRA_SECRETA_SUPER_DIFICIL',
          signOptions: { expiresIn: '1h' },
        }),
      }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [
      // Exportamos por si otros módulos necesitan usar AuthGuard/JwtService
      JwtModule,
      PassportModule,
    ],
  })
  export class AuthModule {}
