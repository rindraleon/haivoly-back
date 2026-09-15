import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateRecommendationDto {
  @IsNotEmpty()
  @IsString()
  userId: string; // 'all' pour broadcast, sinon id utilisateur

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsIn(['INFO', 'WARNING', 'SUCCESS', 'ALERT'])
  type?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
