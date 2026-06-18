import { IsString, MaxLength, MinLength } from "class-validator";

// 채팅 메시지 전송 입력의 보낸 사람과 본문을 검증한다.
export class SendMessageDto {
  @IsString()
  @MinLength(1)
  senderSessionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;
}
