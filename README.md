# Dev Town Backend

NestJS 기반 개발자 타운 채팅 웹 백엔드입니다.

## Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Socket.IO WebSocket
- pnpm

## Getting Started

PostgreSQL 연결 문자열을 준비한 뒤 `.env.example`을 참고해 `DATABASE_URL`을 설정합니다.

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/dev_town?schema=public"
pnpm prisma:generate
pnpm prisma:migrate:dev --name init
pnpm dev
```

HTTP 서버는 기본 `3000` 포트를 사용하며 `PORT`로 변경할 수 있습니다.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## API

- `POST /rooms`: 방 생성 후 초대코드 반환
- `POST /rooms/join`: 초대코드로 방 입장 후 랜덤 캐릭터 세션 생성
- `POST /presence/sessions`: 캐릭터 세션 생성
- `GET /presence/rooms/:roomId/sessions`: 방의 온라인 캐릭터 조회
- `PATCH /presence/sessions/:sessionId/position`: 위치와 방향 갱신
- `POST /chats/conversations`: 가까운 캐릭터 간 대화방 생성 또는 조회
- `GET /chats/conversations/:conversationId/messages`: 최근 메시지 조회
- `POST /chats/conversations/:conversationId/messages`: 보조/관리 목적의 메시지 전송

## Realtime Events

실시간 채팅의 주 경로는 REST가 아니라 Socket.IO입니다. 메시지 송수신은 대화방별 Socket.IO room에서 처리하고, REST는 세션 생성/조회와 이력 조회 보조 용도로 남깁니다.

- namespace: `/town`
- `joinByInviteCode`: 초대코드로 방에 입장하고 랜덤 캐릭터 세션 생성 후 `characterJoined` broadcast
- `joinRoom`: 사무실 방 입장 후 현재 온라인 캐릭터 목록 반환
- `move`: 캐릭터 이동 후 `characterMoved` broadcast
- `openConversation`: 근접/마주보기 조건 확인 후 대화방을 열고 현재 소켓을 `conversation:{conversationId}` room에 입장
- `joinConversation`: 기존 대화방의 `conversation:{conversationId}` room 입장
- `sendMessage`: 메시지 저장 후 같은 대화방 room에 `messageCreated` broadcast

## Project Structure

```text
src/main.ts                 Nest application entry
src/app.module.ts           Root module
src/prisma/                 Prisma client module
src/rooms/                  Room and invite code API
src/presence/               Character session and movement API
src/chat/                   Conversation and message API
src/realtime/               Socket.IO gateway
prisma/schema.prisma        PostgreSQL schema
```

## Database

현재 schema 변경은 신규 생성이며 운영 데이터 삭제는 없습니다.

- `Room`: 방 이름, 초대코드, 사무실 공간 크기
- `DeveloperSession`: 캐릭터 표시명, 방, 위치, 방향, 온라인 상태
- `Conversation`: 두 캐릭터의 방별 대화방
- `ChatMessage`: 대화 메시지
