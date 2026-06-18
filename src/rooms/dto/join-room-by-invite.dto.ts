import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

// 초대코드 입장 요청의 코드와 표시명을 검증한다.
export class JoinRoomByInviteDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  inviteCode!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  displayName?: string;
}
