import type {
  ChatMessage,
  Conversation,
  DeveloperSession,
  Direction,
  Room,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiBaseUrl = API_BASE_URL;
export const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? `${API_BASE_URL.replace(/\/$/, "")}/town`;

export type CreateRoomInput = {
  name?: string;
  width?: number;
  height?: number;
};

export type JoinRoomByInviteInput = {
  inviteCode: string;
  displayName?: string;
};

export type CreateSessionInput = {
  displayName: string;
  avatarColor?: string;
  roomId: string;
};

export type UpdatePositionInput = {
  roomId: string;
  positionX: number;
  positionY: number;
  direction: Direction;
};

export type FindOrCreateConversationInput = {
  requesterSessionId: string;
  peerSessionId: string;
};

export type SendMessageInput = {
  senderSessionId: string;
  body: string;
};

export async function createRoom(input: CreateRoomInput) {
  return requestJson<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function joinRoomByInvite(input: JoinRoomByInviteInput) {
  return requestJson<{ room: Room; session: DeveloperSession }>("/rooms/join", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createSession(input: CreateSessionInput) {
  return requestJson<DeveloperSession>("/presence/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listRoomSessions(roomId: string) {
  return requestJson<DeveloperSession[]>(`/presence/rooms/${roomId}/sessions`);
}

export async function updatePosition(sessionId: string, input: UpdatePositionInput) {
  return requestJson<DeveloperSession>(`/presence/sessions/${sessionId}/position`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function findOrCreateConversation(input: FindOrCreateConversationInput) {
  return requestJson<Conversation>("/chats/conversations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listMessages(conversationId: string) {
  return requestJson<ChatMessage[]>(`/chats/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, input: SendMessageInput) {
  return requestJson<ChatMessage>(`/chats/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
