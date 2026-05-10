import { IsString, IsInt, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PassageDto {
  @ApiProperty()
  @IsString()
  book: string;

  @ApiProperty()
  @IsInt()
  chapter: number;

  @ApiProperty()
  @IsInt()
  start_verse: number;

  @ApiProperty()
  @IsInt()
  end_verse: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  verse_ids?: string[];
}
