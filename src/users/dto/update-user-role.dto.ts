import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'supervisor',
    description: 'Nombre del rol existente que se asignará al usuario.',
    name: 'rol',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-záéíóúñ0-9:_-]+$/i, {
    message: 'El nombre del rol contiene caracteres no permitidos',
  })
  rol!: string;
}
