import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'Supervisa las operaciones y consulta auditoría.',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
