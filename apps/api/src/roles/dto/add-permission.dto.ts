import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddPermissionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  resource: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  action: string;
}
