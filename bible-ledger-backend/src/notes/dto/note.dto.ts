import { IsString, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Source } from '@prisma/client';
import { PassageDto } from '../../shared/dto/passage.dto';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty({ enum: Source, required: false })
  @IsEnum(Source)
  @IsOptional()
  source?: Source;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PassageDto)
  passage: PassageDto;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateNoteDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
