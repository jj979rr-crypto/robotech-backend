import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Query } from '@nestjs/common';
import { LocationAvailabilityQueryDto } from './dto/location-availability.dto';

const helperFilename = (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = extname(file.originalname);
  cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
}

@Controller('location') // Singular, coincide con tu frontend
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'foto', maxCount: 1 },
    { name: 'croquis', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: './uploads/locations',
      filename: helperFilename,
    })
  }))
  create(
    @UploadedFiles() files: { foto?: Express.Multer.File[]; croquis?: Express.Multer.File[] },
    @Body() createLocationDto: CreateLocationDto
  ){
    const fotoPath = files.foto ? files.foto[0].path : null;
    const croquisPath = files.croquis ? files.croquis[0].path : null;
    
    return this.locationService.create(createLocationDto, fotoPath, croquisPath);
  }
  
  @Get()
  findAll() {
    return this.locationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }
  @Get(':id/availability')
  availability(
    @Param('id') id: string,
    @Query('start') start: string,
    @Query('end') end?: string,
  ) {
    return this.locationService.getAvailability(id, start, end);
  }
  
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'foto', maxCount: 1 },
    { name: 'croquis', maxCount: 1 },
  ],{storage: diskStorage({
    destination: './uploads/locations',
    filename: helperFilename
  })})) 
  update(
    @Param('id') id: string, 
    @Body() updateLocationDto: UpdateLocationDto,
    @UploadedFiles() files: { foto?: Express.Multer.File[]; croquis?: Express.Multer.File[] }
  ) {
    const fotoPath = files?.foto?.[0]?.path || null;
    const croquisPath = files?.croquis?.[0]?.path || null;

    return this.locationService.update(id, updateLocationDto, fotoPath, croquisPath);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationService.remove(id);
  }
}