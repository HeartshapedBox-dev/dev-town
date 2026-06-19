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

로컬 개발은 PostgreSQL만 Docker로 띄우고, 백엔드/프론트는 호스트에서 실행하는 구성을 권장합니다.

```bash
pnpm db:up
```

`.env.example`을 복사해 `.env`를 만들고 `DATABASE_URL`을 확인합니다.

```bash
cp .env.example .env
pnpm prisma:migrate:dev --name init
pnpm prisma:generate
pnpm dev
```

Prisma 실행 순서는 다음과 같습니다.

1. `pnpm db:up`
2. `cp .env.example .env`
3. `pnpm prisma:migrate:dev --name init`
4. 필요 시 `pnpm prisma:generate`
5. `pnpm dev`
6. 별도 터미널에서 `pnpm dev:web`

`pnpm prisma:migrate:dev`는 개발용 마이그레이션과 Prisma Client 생성을 함께 처리하므로, 초기 세팅에서는 이 명령이 핵심입니다. 클라이언트만 다시 만들고 싶을 때는 `pnpm prisma:generate`를 사용합니다.

스키마를 이후에 바꿀 때는 `pnpm prisma:migrate:dev --name <migration-name>`을 다시 실행하면 됩니다.

DB 컨테이너를 내리거나 로그를 확인할 때는 다음 명령을 사용합니다.

```bash
pnpm db:down
pnpm db:logs
```

HTTP 서버는 기본 `3000` 포트를 사용하며 `PORT`로 변경할 수 있습니다.

## Frontend

프론트엔드는 `apps/web`에 분리되어 있으며 기본 실행 포트는 `3001`입니다.

```bash
pnpm dev:web
```

필요하면 프론트엔드에서 다음 환경변수를 사용할 수 있습니다.

- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 REST 기본 URL
- `NEXT_PUBLIC_SOCKET_URL`: Socket.IO 연결 URL

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
- `POST /chats/conversations`: 마주보고 있는 캐릭터 간 대화방 생성 또는 조회
- `GET /chats/conversations/:conversationId/messages`: 최근 메시지 조회
- `POST /chats/conversations/:conversationId/messages`: 보조/관리 목적의 메시지 전송

## Realtime Events

실시간 채팅의 주 경로는 REST가 아니라 Socket.IO입니다. 메시지 송수신은 대화방별 Socket.IO room에서 처리하고, REST는 세션 생성/조회와 이력 조회 보조 용도로 남깁니다.

- namespace: `/town`
- `joinByInviteCode`: 초대코드로 방에 입장하고 랜덤 캐릭터 세션 생성 후 `characterJoined` broadcast
- `joinRoom`: 사무실 방 입장 후 현재 온라인 캐릭터 목록 반환
- `move`: 캐릭터 이동 후 `characterMoved` broadcast, 서로 마주본 대화는 `conversationOpened`, 조건이 깨진 대화는 `conversationClosed` 전송
- `openConversation`: 마주보기 조건 확인 후 대화방을 열고 양쪽 소켓을 `conversation:{conversationId}` room에 입장
- `joinConversation`: 기존 대화방의 `conversation:{conversationId}` room 입장
- `sendMessage`: 메시지 저장 후 같은 대화방 room에 `messageCreated` broadcast

대화 메시지는 DB에 유지됩니다. 캐릭터가 떨어지거나 방향이 바뀌어 마주보기 조건이 깨지면 채팅창을 닫기 위한 `conversationClosed` 이벤트만 전송하며, 이전 대화 내용은 삭제하지 않습니다.

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
