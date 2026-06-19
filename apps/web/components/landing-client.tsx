"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRoom,
  createSession,
  joinRoomByInvite,
} from "@/lib/api";
import { saveTownSnapshot } from "@/lib/storage";
import type { Room, DeveloperSession } from "@/lib/types";

const DEFAULT_WIDTH = 20;
const DEFAULT_HEIGHT = 12;

export function LandingClient() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("개발자 타운");
  const [roomWidth, setRoomWidth] = useState(String(DEFAULT_WIDTH));
  const [roomHeight, setRoomHeight] = useState(String(DEFAULT_HEIGHT));
  const [displayName, setDisplayName] = useState("Tester");
  const [inviteCode, setInviteCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [, setCreatedSession] = useState<DeveloperSession | null>(null);
  const [busy, setBusy] = useState<"create-room" | "create-session" | "join-room" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateRoom() {
    setBusy("create-room");
    setError(null);

    try {
      const room = await createRoom({
        name: roomName.trim() || "개발자 타운",
        width: Number(roomWidth),
        height: Number(roomHeight),
      });

      setCreatedRoom(room);
      setCreatedSession(null);
    } catch (cause) {
      setError(getMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateSession() {
    if (!createdRoom) {
      return;
    }

    setBusy("create-session");
    setError(null);

    try {
      const session = await createSession({
        displayName: displayName.trim() || "Tester",
        roomId: createdRoom.id,
      });

      setCreatedSession(session);
      saveTownSnapshot({ room: createdRoom, session });
      router.push(`/town?roomId=${createdRoom.id}&sessionId=${session.id}`);
    } catch (cause) {
      setError(getMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function handleJoinRoom() {
    setBusy("join-room");
    setError(null);

    try {
      const result = await joinRoomByInvite({
        inviteCode: inviteCode.trim(),
        displayName: displayName.trim() || "Tester",
      });

      saveTownSnapshot(result);
      router.push(`/town?roomId=${result.room.id}&sessionId=${result.session.id}`);
    } catch (cause) {
      setError(getMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="banner">
          <div className="banner-inner">
            <span className="eyebrow">Dev Town / entry terminal</span>
            <h1 className="title">
              방을 만들고
              <br />
              바로 타운으로 들어가세요.
            </h1>
            <p className="subtitle">
              이 화면은 새 프론트엔드의 시작점입니다. 방 생성과 초대코드 입장,
              세션 생성, 그리고 타운 메인 화면으로 이동하는 흐름을 한 번에 검증할 수 있게
              구성했습니다.
            </p>

            <div className="metric-row">
              <div className="metric">
                <span className="metric-value">REST + Socket.IO</span>
                <span className="metric-label">백엔드 계약 연결 준비 완료</span>
              </div>
              <div className="metric">
                <span className="metric-value">Next.js App Router</span>
                <span className="metric-label">`apps/web` 기준 분리 구성</span>
              </div>
              <div className="metric">
                <span className="metric-value">Local Port 3001</span>
                <span className="metric-label">백엔드와 별도 포트로 실행</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <section className="panel panel-strong">
            <div className="panel-inner">
              <h2 className="panel-title">새 방 만들기</h2>
              <p className="panel-subtitle">
                방을 생성한 뒤 세션을 만들어 바로 타운으로 진입합니다.
              </p>

              <div className="form-grid">
                <label className="field">
                  <span className="field-label">방 이름</span>
                  <input
                    className="input"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    placeholder="개발자 타운"
                  />
                </label>

                <div className="grid-two">
                  <label className="field">
                    <span className="field-label">가로</span>
                    <input
                      className="input"
                      type="number"
                      min={4}
                      max={200}
                      value={roomWidth}
                      onChange={(event) => setRoomWidth(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">세로</span>
                    <input
                      className="input"
                      type="number"
                      min={4}
                      max={200}
                      value={roomHeight}
                      onChange={(event) => setRoomHeight(event.target.value)}
                    />
                  </label>
                </div>

                {createdRoom ? (
                  <div className="muted-block">
                    <strong>{createdRoom.name}</strong> / 초대코드{" "}
                    <span className="chip chip-success">{createdRoom.inviteCode}</span>
                    <div className="footer-note">
                      세션을 만들면 바로 메인 타운 화면으로 이동합니다.
                    </div>
                  </div>
                ) : null}

                <div className="button-row">
                  <button className="button" type="button" onClick={handleCreateRoom} disabled={busy !== null}>
                    {busy === "create-room" ? "생성 중..." : "방 만들기"}
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      setCreatedRoom(null);
                      setCreatedSession(null);
                      setError(null);
                    }}
                  >
                    초기화
                  </button>
                </div>

                <label className="field">
                  <span className="field-label">표시명</span>
                  <input
                    className="input"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Tester"
                  />
                </label>

                <button
                  className="button"
                  type="button"
                  onClick={handleCreateSession}
                  disabled={!createdRoom || busy !== null}
                >
                  {busy === "create-session" ? "세션 생성 중..." : "세션 만들고 입장"}
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-inner">
              <h2 className="panel-title">초대코드로 입장</h2>
              <p className="panel-subtitle">
                기존 방이 있으면 초대코드로 바로 세션을 생성합니다.
              </p>

              <div className="form-grid">
                <label className="field">
                  <span className="field-label">초대코드</span>
                  <input
                    className="input"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="ABCD12"
                  />
                </label>

                <button className="button" type="button" onClick={handleJoinRoom} disabled={busy !== null}>
                  {busy === "join-room" ? "입장 중..." : "방 입장"}
                </button>
              </div>
            </div>
          </section>

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
        </div>
      </section>
    </main>
  );
}

function getMessage(cause: unknown) {
  if (cause instanceof Error) {
    return cause.message;
  }

  return "요청 처리에 실패했습니다.";
}
