"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  findOrCreateConversation,
  listMessages,
  listRoomSessions,
  sendMessage,
  socketUrl,
  updatePosition,
} from "@/lib/api";
import { loadTownSnapshot, saveTownSnapshot } from "@/lib/storage";
import { isFacingEachOther } from "@/lib/facing";
import type { ChatMessage, Conversation, DeveloperSession, Direction, Room } from "@/lib/types";
import { TownConversationPanel } from "./town-conversation-panel";
import { TownBoard } from "./town/TownBoard";
import { buildOfficeLayout } from "./town/office-map";
import { getBlockedMoveMessage, getBlockingItem } from "./town/collision";

type TownClientProps = {
  initialRoomId?: string;
  initialSessionId?: string;
};

type TownSocket = Socket;

const MOVE_DELTAS: Record<Direction, { x: number; y: number }> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export function TownScreen({ initialRoomId, initialSessionId }: TownClientProps) {
  const router = useRouter();
  const socketRef = useRef<TownSocket | null>(null);
  const sessionRef = useRef<DeveloperSession | null>(null);
  const conversationRef = useRef<Conversation | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<DeveloperSession | null>(null);
  const [sessions, setSessions] = useState<DeveloperSession[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [socketState, setSocketState] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("방을 불러오는 중...");

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

  const currentPeer = sessions.find((candidate) => candidate.id === selectedPeerId) ?? null;
  const canOpenConversation = Boolean(session && currentPeer && isFacingEachOther(session, currentPeer));
  const moveNotice = error ?? hint;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    conversationRef.current = activeConversation;
  }, [activeConversation]);

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
          width: 20,
          height: 12,
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
    if (!room?.id || !session?.id) {
      return;
    }

    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    }) as TownSocket;

    socketRef.current = socket;
    setSocketState("connecting");

    socket.on("connect", async () => {
      setSocketState("connected");
      socket.emit("joinRoom", { roomId: room.id }, () => undefined);

      if (conversationRef.current) {
        socket.emit("joinConversation", { conversationId: conversationRef.current.id }, () => undefined);
      }
    });

    socket.on("disconnect", () => {
      setSocketState("disconnected");
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
  }, [room?.id, session?.id]);

  useEffect(() => {
    const handler = async () => {
      if (room && session) {
        saveTownSnapshot({ room, session });
      }

      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [room, session]);

  if (!room || !session) {
    return (
      <main className="shell">
        <section className="panel">
          <div className="panel-inner">
            <span className="eyebrow">Town bootstrap</span>
            <h1 className="title" style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)" }}>
              세션 정보를 찾을 수 없습니다.
            </h1>
            <p className="panel-subtitle">
              랜딩 화면에서 방을 만들거나 초대코드로 입장한 뒤 다시 이동해 주세요.
            </p>
            <div className="button-row">
              <button className="button" type="button" onClick={() => router.push("/")}>
                시작 화면으로
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell town-shell">
      <section className="stack town-stack">
        <div className="banner town-banner">
          <div className="banner-inner">
            <span className="eyebrow">Dev Town / main map</span>
            <div className="board-meta town-board-meta">
              <div>
                <h1 className="title" style={{ marginBottom: 8 }}>
                  {room.name}
                </h1>
                <p className="subtitle">
                  초대코드 <span className="chip chip-success">{room.inviteCode}</span> · 방 크기{" "}
                  <span className="chip">{roomSizeLabel}</span> · 현재 세션{" "}
                  <span className="chip chip-warning">{session.displayName}</span>
                </p>
              </div>

              <div className="button-row town-toolbar">
                <span className={`chip ${socketState === "connected" ? "chip-success" : "chip-warning"}`}>
                  {socketState === "connected" ? "소켓 연결됨" : socketState === "connecting" ? "연결 중" : "오프라인"}
                </span>
                <button className="button button-secondary" type="button" onClick={() => void refreshSessions(room.id, setSessions, setHint)}>
                  세션 새로고침
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="town-layout">
          <div className="town-main-column">
            {officeLayout ? (
              <TownBoard
                room={room}
                session={session}
                sessions={sessions}
                selectedPeerId={selectedPeerId}
                onSelectPeer={setSelectedPeerId}
                onMove={(direction) =>
                  void moveSession(
                    session,
                    direction,
                    room,
                    officeLayout,
                    socketRef.current,
                    setSession,
                    setSessions,
                    setHint,
                    setError,
                  )
                }
                connectionState={socketState}
                blockedNotice={moveNotice}
              />
            ) : null}
          </div>

          <aside className="town-sidebar">
            <section className="panel">
              <div className="panel-inner">
                <h2 className="panel-title">현재 세션</h2>
                <p className="panel-subtitle">{hint}</p>

                <div className="session-card session-card-active town-self-card" style={{ cursor: "default" }}>
                  <div className="session-topline">
                    <div className="session-name">
                      <span className="dot dot-online" style={{ background: session.avatarColor }} />
                      <div>
                        <div>{session.displayName}</div>
                        <div className="mini">ID: {session.id}</div>
                      </div>
                    </div>
                    <span className="chip">{session.direction}</span>
                  </div>

                  <div className="mini">
                    좌표: ({session.positionX}, {session.positionY}) · 상태: {session.status}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-inner">
                <h2 className="panel-title">온라인 세션</h2>
                <p className="panel-subtitle">세션을 클릭하면 대화 가능 여부를 확인하고 대화방을 엽니다.</p>

                <div className="session-list">
                  {sessions.map((candidate) => (
                    <button
                      key={candidate.id}
                      className={`session-card ${candidate.id === selectedPeerId ? "session-card-active" : ""}`}
                      type="button"
                      onClick={() => setSelectedPeerId(candidate.id === session.id ? null : candidate.id)}
                    >
                      <div className="session-topline">
                        <div className="session-name">
                          <span
                            className={`dot ${candidate.status === "ONLINE" ? "dot-online" : "dot-offline"}`}
                            style={{ background: candidate.avatarColor }}
                          />
                          {candidate.displayName}
                        </div>
                        <span className="chip">{candidate.direction}</span>
                      </div>
                      <div className="mini">
                        ({candidate.positionX}, {candidate.positionY}) · {candidate.status}
                      </div>
                    </button>
                  ))}
                </div>

                {currentPeer ? (
                  <div className="footer-note">
                    {isFacingEachOther(session, currentPeer)
                      ? "마주보는 상태라 대화방을 열 수 있습니다."
                      : "현재 위치/방향에서는 대화방을 열 수 없습니다."}
                  </div>
                ) : null}

                <div className="button-row" style={{ marginTop: 14 }}>
                  <button
                    className="button"
                    type="button"
                    disabled={!canOpenConversation}
                    onClick={() => void openConversation(session, currentPeer, socketRef.current, setActiveConversation, setMessages, setError)}
                  >
                    대화 열기
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      setActiveConversation(null);
                      setMessages([]);
                    }}
                  >
                    채팅 닫기
                  </button>
                </div>
              </div>
            </section>

            <TownConversationPanel
              conversation={activeConversation}
              messages={messages}
              currentSession={session}
              draft={draft}
              onDraftChange={setDraft}
              onSendMessage={() => {
                const conversation = activeConversation;
                if (!conversation) {
                  return;
                }

                void handleSendMessage(
                  draft,
                  session,
                  conversation,
                  socketRef.current,
                  setDraft,
                  setMessages,
                  setError,
                );
              }}
            />
          </aside>
        </div>

        {error ? (
          <section className="panel">
            <div className="panel-inner">
              <span className="chip chip-danger">오류</span>
              <p className="panel-subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
                {error}
              </p>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

async function refreshSessions(
  roomId: string,
  setSessions: Dispatch<SetStateAction<DeveloperSession[]>>,
  setHint: (value: string) => void,
) {
  const latest = await listRoomSessions(roomId);
  setSessions(latest);
  setHint(`방에 ${latest.length}명의 세션이 연결되어 있습니다.`);
}

async function moveSession(
  session: DeveloperSession,
  direction: Direction,
  room: Room,
  layout: ReturnType<typeof buildOfficeLayout> | null,
  socket: TownSocket | null,
  setSession: Dispatch<SetStateAction<DeveloperSession | null>>,
  setSessions: Dispatch<SetStateAction<DeveloperSession[]>>,
  setHint: (value: string) => void,
  setError: Dispatch<SetStateAction<string | null>>,
) {
  const delta = MOVE_DELTAS[direction];
  const nextPositionX = clamp(session.positionX + delta.x, 0, room.width - 1);
  const nextPositionY = clamp(session.positionY + delta.y, 0, room.height - 1);

  const blockingItem = layout ? getBlockingItem(layout, nextPositionX, nextPositionY) : null;
  if (blockingItem) {
    const message = getBlockedMoveMessage(blockingItem);
    setError(message);
    setHint(message);
    return;
  }

  const positionPayload = {
    roomId: room.id,
    positionX: nextPositionX,
    positionY: nextPositionY,
    direction,
  };

  const optimisticSession: DeveloperSession = {
    ...session,
    ...positionPayload,
  };

  setError(null);
  setSession(optimisticSession);
  upsertSession(setSessions, optimisticSession);

  try {
    const updated = await updatePosition(session.id, positionPayload);
    setSession(updated);
    upsertSession(setSessions, updated);
    setHint(`좌표 (${updated.positionX}, ${updated.positionY})`);

    if (socket?.connected) {
      socket.emit("move", {
        sessionId: session.id,
        ...positionPayload,
      });
    }
  } catch (cause) {
    setError(getMessage(cause));
    setSession(session);
    upsertSession(setSessions, session);
  }
}

async function openConversation(
  session: DeveloperSession,
  peer: DeveloperSession | null,
  socket: TownSocket | null,
  setActiveConversation: Dispatch<SetStateAction<Conversation | null>>,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setError: Dispatch<SetStateAction<string | null>>,
) {
  if (!peer || !socket) {
    return;
  }

  try {
    const conversation = socket.connected
      ? await socket.timeout(5000).emitWithAck("openConversation", {
          requesterSessionId: session.id,
          peerSessionId: peer.id,
        })
      : await findOrCreateConversation({
          requesterSessionId: session.id,
          peerSessionId: peer.id,
        });

    setActiveConversation(conversation);
    if (socket?.connected) {
      socket.emit("joinConversation", { conversationId: conversation.id }, () => undefined);
    }
    setMessages(await listMessages(conversation.id));
  } catch (cause) {
    setError(getMessage(cause));
  }
}

async function handleSendMessage(
  draft: string,
  session: DeveloperSession,
  conversation: Conversation,
  socket: TownSocket | null,
  setDraft: Dispatch<SetStateAction<string>>,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setError: Dispatch<SetStateAction<string | null>>,
) {
  const body = draft.trim();
  if (!body) {
    return;
  }

  try {
    const message = socket?.connected
      ? await socket.timeout(5000).emitWithAck("sendMessage", {
          conversationId: conversation.id,
          senderSessionId: session.id,
          body,
        })
      : await sendMessage(conversation.id, {
          senderSessionId: session.id,
          body,
        });

    if (!socket?.connected) {
      setMessages((current) => [...current, message]);
    }
    setDraft("");
  } catch (cause) {
    setError(getMessage(cause));
  }
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
