import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID del permiso que se asignará o retirará.',
  })
  @IsUUID()
  permisoId!: string;
}
