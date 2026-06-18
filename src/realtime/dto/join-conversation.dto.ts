import { IsString, MinLength } from "class-validator";

// 클라이언트가 구독할 대화방 식별자를 검증한다.
export class JoinConversationDto {
  @IsString()
  @MinLength(1)
  conversationId!: string;
}
