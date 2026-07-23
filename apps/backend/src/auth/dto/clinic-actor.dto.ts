import { IsIn, IsString, IsUUID, Length } from 'class-validator';

export class ActivateClinicActorDto {
  @IsIn(['OPERATOR', 'DOCTOR'])
  actorType: 'OPERATOR' | 'DOCTOR';

  @IsUUID()
  actorId: string;

  @IsString()
  @Length(6, 6)
  pin: string;
}
