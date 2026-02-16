// src/reniec/reniec.module.ts
import { Module } from '@nestjs/common';
import { ReniecService } from './reniec.service';
import { ReniecController } from './reniec.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],         // 👈 IMPORTANTE
  controllers: [ReniecController],
  providers: [ReniecService],
  exports: [ReniecService],
})
export class ReniecModule {}
