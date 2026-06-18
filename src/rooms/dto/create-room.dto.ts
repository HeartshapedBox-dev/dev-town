import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

// 방 생성 요청의 이름과 공간 크기를 검증한다.
export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(200)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(200)
  height?: number;
}
