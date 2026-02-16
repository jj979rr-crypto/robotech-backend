import {CreateTournamentDto} from '../dto/create-tournament.dto';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isNotEqualTournamentLocation', async: false })
export class IsNotEqualTournamentLocationValidator 
    implements ValidatorConstraintInterface {
  validate(nombre: string, args: ValidationArguments) {
    const tournament = args.object as CreateTournamentDto;

     if (!tournament.location) return true;

     return (
        tournament.location.trim().toLowerCase() !==
        nombre.trim().toLowerCase()    
     );
  }
  
  defaultMessage() {
    return 'El nombre del torneo no puede ser igual al nombre de la sede';
  }
}