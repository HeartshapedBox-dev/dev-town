import { IsString, MinLength } from "class-validator";

// 두 캐릭터가 대화방을 열 수 있는지 확인할 입력을 검증한다.
export class FindOrCreateConversationDto {
  @IsString()
  @MinLength(1)
  requesterSessionId!: string;

  @IsString()
  @MinLength(1)
  peerSessionId!: string;
}
