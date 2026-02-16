import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository } from 'typeorm';
import { Tournament } from '../tournament/entities/tournament.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  // ✅ Normaliza rutas (windows -> unix)
  private normalizePath(p: string | null) {
    return p ? p.replace(/\\/g, '/') : null;
  }

  // ✅ Convierte "true"/"false" -> boolean (multipart suele mandar strings)
  private parseBoolean(v: any): boolean | undefined {
    if (v === undefined || v === null || v === '') return undefined;
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    throw new BadRequestException('disponible inválido');
  }

  async create(
    createLocationDto: CreateLocationDto,
    fotoPath: string | null,
    croquisPath: string | null,
  ) {
    const cleanFotoPath = this.normalizePath(fotoPath);
    const cleanCroquisPath = this.normalizePath(croquisPath);

    const location = this.locationRepository.create({
      ...createLocationDto,
      // ✅ default: disponible = true si no viene
      disponible:
        this.parseBoolean((createLocationDto as any).disponible) ?? true,
      imagenUrl: cleanFotoPath,
      mapaUrl: cleanCroquisPath,
    });

    return await this.locationRepository.save(location);
  }

  async findAll() {
    return await this.locationRepository.find({
      relations: ['tournaments'],
    });
  }

  async findOne(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['tournaments'],
    });

    if (!location) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }
    return location;
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
    fotoPath: string | null,
    croquisPath: string | null,
  ) {
    // ✅ aseguramos que exista y tenemos el estado actual
    const existing = await this.locationRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    // ✅ si viene disponible como string, lo convertimos
    const disponibleParsed = this.parseBoolean(
      (updateLocationDto as any).disponible,
    );

    // ✅ merge manual para evitar “cosas raras” con multipart
    const location = this.locationRepository.merge(existing, {
      ...updateLocationDto,
      ...(disponibleParsed !== undefined ? { disponible: disponibleParsed } : {}),
    });

    const cleanFotoPath = this.normalizePath(fotoPath);
    const cleanCroquisPath = this.normalizePath(croquisPath);

    if (cleanFotoPath) location.imagenUrl = cleanFotoPath;
    if (cleanCroquisPath) location.mapaUrl = cleanCroquisPath;

    return await this.locationRepository.save(location);
  }

  async remove(id: string) {
    const location = await this.findOne(id);
    return await this.locationRepository.remove(location);
  }

  async getAvailability(locationId: string, start: string, end?: string) {
    const loc = await this.locationRepository.findOne({ where: { id: locationId } });
    if (!loc) throw new NotFoundException(`Sede con ID ${locationId} no encontrada`);

    if (loc.disponible === false) {
      return {
        locationId,
        status: 'MAINTENANCE',
        reason: 'La sede está en mantenimiento.',
        conflicts: [],
      };
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) throw new BadRequestException('start inválido');

    const endDate = end ? new Date(end) : startDate;
    if (isNaN(endDate.getTime())) throw new BadRequestException('end inválido');

    const bufferDays = 2;
    const startWithBuffer = new Date(startDate);
    startWithBuffer.setDate(startWithBuffer.getDate() - bufferDays);

    const endWithBuffer = new Date(endDate);
    endWithBuffer.setDate(endWithBuffer.getDate() + bufferDays);

    const conflicts = await this.tournamentRepository
      .createQueryBuilder('t')
      .leftJoin('t.location', 'loc')
      .where('loc.id = :locationId', { locationId })
      .andWhere('t.fechaInicio <= :endWithBuffer', { endWithBuffer })
      .andWhere('COALESCE(t.fechaFin, t.fechaInicio) >= :startWithBuffer', { startWithBuffer })
      .select(['t.id', 't.nombre', 't.fechaInicio', 't.fechaFin'])
      .getMany();

    if (conflicts.length > 0) {
      return {
        locationId,
        status: 'OCCUPIED',
        reason: 'La sede tiene un torneo que bloquea el rango (considerando buffer ±2 días).',
        conflicts,
      };
    }

    return {
      locationId,
      status: 'AVAILABLE',
      reason: 'Sede disponible para ese rango (considerando buffer ±2 días).',
      conflicts: [],
    };
  }
}
