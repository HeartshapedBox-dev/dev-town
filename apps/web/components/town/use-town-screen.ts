"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { io, type Socket } from "socket.io-client";
import {
  findOrCreateConversation,
  listMessages,
  listRoomSessions,
  sendMessage,
  socketUrl,
  updatePosition,
} from "@/lib/api";
import { isFacingEachOther } from "@/lib/facing";
import { clearTownSnapshot, loadTownSnapshot, saveTownSnapshot } from "@/lib/storage";
import type { ChatMessage, Conversation, DeveloperSession, Direction, Room } from "@/lib/types";
import { OFFICE_ROOM_PRESET } from "../room-presets";
import { buildOfficeLayout } from "./office-map";
import { createMovePlan } from "./movement";

type UseTownScreenOptions = {
  initialRoomId?: string;
  initialSessionId?: string;
};

type SocketState = "idle" | "connecting" | "connected" | "disconnected";
type TerminalState = "room-closed" | "session-ended" | null;

export function useTownScreen({ initialRoomId, initialSessionId }: UseTownScreenOptions) {
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<DeveloperSession | null>(null);
  const conversationRef = useRef<Conversation | null>(null);
  const selectedPeerRef = useRef<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<DeveloperSession | null>(null);
  const [sessions, setSessions] = useState<DeveloperSession[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("방을 불러오는 중...");
  const [terminalState, setTerminalState] = useState<TerminalState>(null);
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);

  const roomSizeLabel = useMemo(() => {
    if (!room) {
      return "미확인";
    }

    return `${room.width} x ${room.height}`;
  }, [room]);

  const officeLayout = useMemo(() => {
    if (!room) {
      return null;
    }

    return buildOfficeLayout(room.width, room.height);
  }, [room]);

  const currentSession = useMemo(() => {
    if (!session) {
      return null;
    }

    return sessions.find((candidate) => candidate.id === session.id) ?? session;
  }, [session, sessions]);

  const peerSessions = useMemo(() => {
    if (!currentSession) {
      return sessions;
    }

    return sessions.filter((candidate) => candidate.id !== currentSession.id);
  }, [currentSession?.id, sessions]);

  const currentPeer = sessions.find((candidate) => candidate.id === selectedPeerId) ?? null;
  const canOpenConversation = Boolean(currentSession && currentPeer && isFacingEachOther(currentSession, currentPeer));
  const moveNotice = error ?? hint;

  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);

  useEffect(() => {
    conversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    selectedPeerRef.current = selectedPeerId;
  }, [selectedPeerId]);

  useEffect(() => {
    if (!currentSession) {
      setSelectedPeerId(null);
      return;
    }

    setSelectedPeerId((current) => {
      const existingPeer = current ? sessions.find((candidate) => candidate.id === current) : null;
      if (existingPeer && existingPeer.id !== currentSession.id) {
        return current;
      }

      if (peerSessions.length === 1) {
        return peerSessions[0].id;
      }

      return null;
    });
  }, [currentSession?.id, peerSessions, sessions]);

  useEffect(() => {
    const snapshot = loadTownSnapshot();
    const snapshotRoom = snapshot?.room ?? null;
    const snapshotSession = snapshot?.session ?? null;

    if (snapshotRoom) {
      setRoom(snapshotRoom);
    }

    if (snapshotSession) {
      setSession(snapshotSession);
    }

    if (!snapshotRoom && initialRoomId) {
      setRoom((current) =>
        current ?? {
          id: initialRoomId,
          name: "개발자 타운",
          inviteCode: "UNKNOWN",
          width: OFFICE_ROOM_PRESET.width,
          height: OFFICE_ROOM_PRESET.height,
        },
      );
    }

    if (!snapshotSession && initialSessionId) {
      setHint(`세션 ${initialSessionId}를 기준으로 접속 준비 중입니다.`);
    }
  }, [initialRoomId, initialSessionId]);

  useEffect(() => {
    if (!room) {
      return;
    }

    let active = true;
    const roomId = room.id;
    const roomName = room.name;

    async function loadSessions() {
      try {
        const latest = await listRoomSessions(roomId);
        if (!active) {
          return;
        }

        setSessions(latest);
        if (!sessionRef.current && latest.length > 0) {
          setSession(latest[0]);
        }
        setHint(`방 ${roomName}에 ${latest.length}명의 세션이 연결되어 있습니다.`);
        setError(null);
      } catch (cause) {
        if (!active) {
          return;
        }

        setError(getMessage(cause));
      }
    }

    void loadSessions();

    return () => {
      active = false;
    };
  }, [room]);

  useEffect(() => {
    if (!room?.id || !currentSession?.id) {
      return;
    }

    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;
    setSocketState("connecting");

    socket.on("connect", () => {
      setSocketState("connected");
      void socket
        .timeout(5000)
        .emitWithAck("joinRoom", { roomId: room.id, sessionId: currentSession.id })
        .then((latestSessions) => {
          if (Array.isArray(latestSessions)) {
            setSessions(latestSessions);
          }
        })
        .catch((cause) => {
          setError(getMessage(cause));
        });

      if (conversationRef.current) {
        socket.emit("joinConversation", { conversationId: conversationRef.current.id }, () => undefined);
      }
    });

    socket.on("disconnect", () => {
      setSocketState("disconnected");
      setTerminalState((current) => current ?? "session-ended");
      setTerminalMessage((current) => current ?? "연결이 끊어졌습니다.");
    });

    socket.on("characterJoined", (joinedSession) => {
      upsertSession(setSessions, joinedSession);
    });

    socket.on("characterMoved", (movedSession) => {
      if (movedSession.id === sessionRef.current?.id) {
        setSession(movedSession);
      }

      upsertSession(setSessions, movedSession);
    });

    socket.on("roomSessionsSynced", (latestSessions) => {
      if (Array.isArray(latestSessions)) {
        setSessions(latestSessions);
      }
    });

    socket.on("conversationOpened", async (conversation) => {
      setActiveConversation(conversation);
      if (
        conversation.participantAId === sessionRef.current?.id ||
        conversation.participantBId === sessionRef.current?.id
      ) {
        setSelectedPeerId(
          conversation.participantAId === sessionRef.current?.id
            ? conversation.participantBId
            : conversation.participantAId,
        );
      }

      try {
        const latest = await listMessages(conversation.id);
        setMessages(latest);
      } catch (cause) {
        setError(getMessage(cause));
      }
    });

    socket.on("conversationClosed", (payload) => {
      setMessages((current) => (conversationRef.current?.id === payload.conversationId ? [] : current));
      setActiveConversation((current) => (current?.id === payload.conversationId ? null : current));
    });

    socket.on("sessionEnded", (payload) => {
      setSessions((current) => current.filter((candidate) => candidate.id !== payload.sessionId));
      if (selectedPeerRef.current === payload.sessionId) {
        setSelectedPeerId(null);
      }
      if (payload.sessionId === sessionRef.current?.id) {
        setTerminalState("session-ended");
        setTerminalMessage("세션 연결이 종료되었습니다.");
        setActiveConversation(null);
        setMessages([]);
        setDraft("");
      }
      setHint(`세션 ${payload.sessionId}가 종료되었습니다.`);
    });

    socket.on("roomClosed", (payload) => {
      clearTownSnapshot();
      setTerminalState("room-closed");
      setTerminalMessage(`방 ${payload.roomId}가 종료되었습니다.`);
      setRoom(null);
      setSession(null);
      setSessions([]);
      setSelectedPeerId(null);
      setActiveConversation(null);
      setMessages([]);
      setDraft("");
      setError(null);
      setHint("방이 종료되어 연결이 해제되었습니다.");
      setSocketState("disconnected");
    });

    socket.on("messageCreated", (message) => {
      setMessages((current) => {
        if (current.some((candidate) => candidate.id === message.id)) {
          return current;
        }

        if (conversationRef.current?.id !== message.conversationId) {
          return current;
        }

        return [...current, message];
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentSession?.id, room?.id]);

  useEffect(() => {
    const handler = async () => {
      if (terminalState) {
        clearTownSnapshot();
        return;
      }

      if (room && currentSession) {
        saveTownSnapshot({ room, session: currentSession });
      }

      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [room, currentSession, terminalState]);

  async function refreshSessions() {
    if (!room) {
      return;
    }

    try {
      const latest = await listRoomSessions(room.id);
      setSessions(latest);
      setHint(`방에 ${latest.length}명의 세션이 연결되어 있습니다.`);
      setError(null);
    } catch (cause) {
      setError(getMessage(cause));
    }
  }

  async function handleMove(direction: Direction) {
    if (!room || !currentSession || !officeLayout) {
      return;
    }

    const movePlan = createMovePlan(currentSession, room, direction, officeLayout, sessions);
    if (movePlan.blocked) {
      const message = movePlan.message;
      setError(message);
      setHint(message);
      return;
    }

    setError(null);
    setSession(movePlan.session);
    upsertSession(setSessions, movePlan.session);

    try {
      const updated = await updatePosition(currentSession.id, movePlan.updatePosition);
      setSession(updated);
      upsertSession(setSessions, updated);
      setHint(`좌표(0-base) (${updated.positionX}, ${updated.positionY})`);

      if (socketRef.current?.connected) {
        socketRef.current.emit("move", movePlan.socketPayload);
      }
    } catch (cause) {
      setError(getMessage(cause));
      setSession(currentSession);
      upsertSession(setSessions, currentSession);
    }
  }

  async function handleOpenConversation() {
    if (!currentSession || !currentPeer) {
      return;
    }

    try {
      const socket = socketRef.current;
      const conversation = socket?.connected
        ? await socket.timeout(5000).emitWithAck("openConversation", {
            requesterSessionId: currentSession.id,
            peerSessionId: currentPeer.id,
          })
        : await findOrCreateConversation({
            requesterSessionId: currentSession.id,
            peerSessionId: currentPeer.id,
          });

      setActiveConversation(conversation);
      if (socket?.connected) {
        socket.emit("joinConversation", { conversationId: conversation.id }, () => undefined);
      }
      setMessages(await listMessages(conversation.id));
      setError(null);
    } catch (cause) {
      setError(getMessage(cause));
    }
  }

  async function handleSendMessage() {
    if (!activeConversation || !currentSession) {
      return;
    }

    const body = draft.trim();
    if (!body) {
      return;
    }

    try {
      const socket = socketRef.current;
      const message = socket?.connected
        ? await socket.timeout(5000).emitWithAck("sendMessage", {
            conversationId: activeConversation.id,
            senderSessionId: currentSession.id,
            body,
          })
        : await sendMessage(activeConversation.id, {
            senderSessionId: currentSession.id,
            body,
          });

      if (!socket?.connected) {
        setMessages((current) => [...current, message]);
      }
      setDraft("");
      setError(null);
    } catch (cause) {
      setError(getMessage(cause));
    }
  }

  async function handleDisconnectSession() {
    const socket = socketRef.current;

    clearTownSnapshot();
    setError(null);
    setTerminalState("session-ended");
    setTerminalMessage("세션 연결을 종료합니다.");
    setRoom(null);
    setSession(null);
    setSessions([]);
    setSelectedPeerId(null);
    setActiveConversation(null);
    setMessages([]);
    setDraft("");
    setHint("세션 연결을 종료합니다.");

    if (socket?.connected && currentSession) {
      try {
        await socket.timeout(5000).emitWithAck("leaveSession");
      } catch (cause) {
        setError(getMessage(cause));
      }
    }

    socket?.disconnect();
    setSocketState("disconnected");
  }

  function handleSelectPeer(peerId: string | null) {
    setSelectedPeerId((current) => {
      if (peerId === currentSession?.id) {
        return null;
      }

      return current === peerId ? null : peerId;
    });
  }

  function clearConversation() {
    setActiveConversation(null);
    setMessages([]);
  }

  return {
    room,
    session: currentSession,
    sessions,
    selectedPeerId,
    activeConversation,
    messages,
    draft,
    socketState,
    error,
    hint,
    roomSizeLabel,
    officeLayout,
    currentPeer,
    canOpenConversation,
    moveNotice,
    setDraft,
    handleSelectPeer,
    handleMove,
    handleOpenConversation,
    handleSendMessage,
    handleDisconnectSession,
    clearConversation,
    refreshSessions,
    terminalState,
    terminalMessage,
  };
}

function upsertSession(
  setSessions: Dispatch<SetStateAction<DeveloperSession[]>>,
  updated: DeveloperSession,
) {
  setSessions((current) => {
    const index = current.findIndex((candidate) => candidate.id === updated.id);
    if (index === -1) {
      return [...current, updated];
    }

    const copy = [...current];
    copy[index] = updated;
    return copy;
  });
}

function getMessage(cause: unknown) {
  if (cause instanceof Error) {
    return cause.message;
  }

  return String(cause);
}
