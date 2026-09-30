import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'supervisor',
    description: 'Nombre único del rol.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-záéíóúñ0-9:_-]+$/i, {
    message:
      'El nombre del rol solo puede contener letras, números, guiones, guiones bajos y dos puntos',
  })
  nombre!: string;

  @ApiProperty({
    example: 'Supervisa las operaciones de la organización.',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
