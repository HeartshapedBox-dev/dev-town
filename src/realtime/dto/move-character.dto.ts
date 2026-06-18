import { IsString, MinLength } from "class-validator";
import { UpdatePositionDto } from "../../presence/dto/update-position.dto";

// 웹소켓 이동 이벤트에서 세션 식별자와 이동 값을 함께 검증한다.
export class MoveCharacterDto extends UpdatePositionDto {
  @IsString()
  @MinLength(1)
  sessionId!: string;
}
