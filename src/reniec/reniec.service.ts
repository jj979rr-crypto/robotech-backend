// src/reniec/reniec.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ReniecService {
  private readonly apiUrl = 'https://dniruc.apisperu.com/api/v1/dni';
  private readonly token: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.token =
      this.config.get<string>('RENIEC_API_TOKEN') ?? 'TU_TOKEN_AQUI_SI_QUIERES_HARDCODEAR';
  }

  // Base simulada para pruebas (solo con nombres reales, sin genérico)
  private readonly fakeDb = [
    { dni: '12345678', nombres: 'JUAN', apellidos: 'PEREZ', fechaNacimiento: '1990-05-15' },
    { dni: '87654321', nombres: 'MARIA', apellidos: 'GONZALES', fechaNacimiento: '1995-08-20' },
    { dni: '11112222', nombres: 'ROCKY', apellidos: 'BALBOA', fechaNacimiento: '1985-07-06' },
    { dni: '99999999', nombres: 'OPTIMUS', apellidos: 'PRIME', fechaNacimiento: '1980-01-01' },
  ];

  async consultarDni(dni: string) {
    const cleanDni = (dni || '').trim();

    // 1. Validación básica
    if (!/^\d{8}$/.test(cleanDni)) {
      throw new BadRequestException('El DNI debe tener exactamente 8 dígitos numéricos.');
    }

    // 2. Intentamos API real
    try {
      if (this.token && this.token !== 'TU_TOKEN_AQUI_SI_QUIERES_HARDCODEAR') {
        const url = `${this.apiUrl}/${cleanDni}?token=${this.token}`;
        const resp = await lastValueFrom(this.http.get(url));
        const data = resp.data;

        // Formato típico de ApisPeru: { dni, nombres, apellidoPaterno, apellidoMaterno, ... }
        if (data && data.dni) {
          return {
            success: true,
            data: {
              dni: data.dni,
              nombres: data.nombres,
              apellidos: `${data.apellidoPaterno ?? ''} ${data.apellidoMaterno ?? ''}`.trim(),
            },
            source: 'RENIEC_API_REAL',
          };
        }

        // Si llega aquí, la API respondió pero sin datos válidos
        return {
          success: false,
          message: 'DNI no encontrado en RENIEC. Ingresa los datos manualmente.',
        };
      }
    } catch (err: any) {
      console.error('❌ Error llamando a RENIEC real:', err?.response?.data ?? err.message);
      // No lanzamos excepción hacia el front: devolvemos "success: false" para que el front permita escribir
      return {
        success: false,
        message: 'No se pudo consultar RENIEC. Ingresa tus datos manualmente.',
      };
    }

    // 3. Fallback: base VIP simulada (por si quieres seguir probando sin internet)
    const ciudadano = this.fakeDb.find((c) => c.dni === cleanDni);
    if (ciudadano) {
      return {
        success: true,
        data: ciudadano,
        source: 'RENIEC_SIMULADO_VIP',
      };
    }

    // 4. Nada encontrado → NO genérico, solo indicamos que llene manual
    return {
      success: false,
      message: 'DNI no encontrado. Ingresa tus nombres y apellidos manualmente.',
    };
  }
}
