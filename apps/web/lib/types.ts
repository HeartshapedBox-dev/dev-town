export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type Room = {
  id: string;
  name: string;
  inviteCode: string;
  width: number;
  height: number;
  ownerSessionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DeveloperSession = {
  id: string;
  displayName: string;
  avatarColor: string;
  roomId: string;
  positionX: number;
  positionY: number;
  direction: Direction;
  status: "ONLINE" | "OFFLINE";
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Conversation = {
  id: string;
  roomId: string;
  participantAId: string;
  participantBId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type TownSnapshot = {
  room: Room;
  session: DeveloperSession;
};
