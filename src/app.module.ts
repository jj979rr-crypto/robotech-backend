// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClubModule } from './club/club.module';
import { CompetitorModule } from './competitor/competitor.module';
import { ReniecModule } from './reniec/reniec.module';
import { RobotModule } from './robot/robot.module';
import { TournamentModule } from './tournament/tournament.module';
import { LocationModule } from './location/location.module';
import { InscriptionModule } from './inscription/inscription.module';
import { CategoriesModule } from './categories/categories.module';
import { RankingModule } from './ranking/ranking.module';
import { MatchModule } from './match/match.module';
import { BehaviorModule } from './behavior/behavior.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads/',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        // Recomendado en Nest + TypeORM
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNC') === 'true',
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const user = configService.get<string>('EMAIL_USER');
        const pass = configService.get<string>('EMAIL_PASSWORD');
        const isProduction = user && pass && pass !== 'tu_contraseña_de_aplicacion';

        if (isProduction) {
          console.log('EMAIL: Conectando a Gmail...');
          return {
            transport: {
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: { user, pass },
            },
            defaults: { from: '"Robotech Security" <noreply@robotech.com>' },
          };
        }

        console.log('Codigo de verificacion enviado');
        return {
          transport: { jsonTransport: true },
          defaults: { from: '"Robotech Dev" <dev@robotech.com>' },
        };
      },
    }),

    UsersModule,
    AuthModule,
    ClubModule,
    CompetitorModule,
    ReniecModule,
    RobotModule,
    TournamentModule,
    LocationModule,
    InscriptionModule,
    CategoriesModule,
    RankingModule,
    MatchModule,
    BehaviorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
