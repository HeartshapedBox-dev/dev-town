import {
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

// 방에 입장하는 개발자 캐릭터의 기본 정보를 검증한다.
export class CreateSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  displayName!: string;

  @IsOptional()
  @IsHexColor()
  avatarColor?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  roomId!: string;
}
