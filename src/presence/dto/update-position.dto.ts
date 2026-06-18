import { Direction } from "@prisma/client";
import { IsEnum, IsInt, IsString, Max, Min, MinLength } from "class-validator";

// 캐릭터 이동 요청의 좌표와 방향 값을 검증한다.
export class UpdatePositionDto {
  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsInt()
  @Min(0)
  @Max(200)
  positionX!: number;

  @IsInt()
  @Min(0)
  @Max(200)
  positionY!: number;

  @IsEnum(Direction)
  direction!: Direction;
}
