import { IsString, IsEnum, IsOptional, ValidateNested, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Source, Status } from '@prisma/client';
import { PassageDto } from '../../shared/dto/passage.dto';

export class CreateLedgerEntryDto {
  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty({ enum: Status, default: Status.CONFIRMED })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @ApiProperty({ enum: Source })
  @IsEnum(Source)
  source: Source;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  start_time?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  end_time?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PassageDto)
  passage: PassageDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  translation_id?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
