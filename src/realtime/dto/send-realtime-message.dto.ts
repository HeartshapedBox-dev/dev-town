import { IsString, MinLength } from "class-validator";
import { SendMessageDto } from "../../chat/dto/send-message.dto";

// 웹소켓 메시지 이벤트에서 대화방 식별자와 메시지 본문을 함께 검증한다.
export class SendRealtimeMessageDto extends SendMessageDto {
  @IsString()
  @MinLength(1)
  conversationId!: string;
}
