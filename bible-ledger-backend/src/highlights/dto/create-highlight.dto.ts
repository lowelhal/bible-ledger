import { IsString, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Source } from '@prisma/client';
import { PassageDto } from '../../shared/dto/passage.dto';

export class CreateHighlightDto {
  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PassageDto)
  passage: PassageDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color_hex?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: Source, required: false })
  @IsEnum(Source)
  @IsOptional()
  source?: Source;
}
