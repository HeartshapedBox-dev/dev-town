"use client";

import { useRouter } from "next/navigation";
import { TownConversationPanel } from "./town/conversation-panel";
import { TownBoard } from "./town/TownBoard";
import { getVisibleCharacterPosition } from "./town/character-position";
import { useTownScreen } from "./town/use-town-screen";

type TownClientProps = {
  initialRoomId?: string;
  initialSessionId?: string;
};

export function TownScreen({ initialRoomId, initialSessionId }: TownClientProps) {
  const router = useRouter();
  const {
    room,
    session,
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
  } = useTownScreen({ initialRoomId, initialSessionId });
  const visibleArea = officeLayout ?? room;
  const visibleSessionPosition = visibleArea && session ? getVisibleCharacterPosition(session, visibleArea) : null;

  if (terminalState && terminalMessage) {
    return (
      <main className="shell">
        <section className="panel">
          <div className="panel-inner">
            <span className="eyebrow">Town closed</span>
            <h1 className="title" style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)" }}>
              {terminalMessage}
            </h1>
            <p className="panel-subtitle">
              연결이 종료되었습니다. 시작 화면으로 돌아가 다시 접속할 수 있습니다.
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
                <button className="button button-secondary" type="button" onClick={() => void refreshSessions()}>
                  세션 새로고침
                </button>
                <button className="button button-secondary" type="button" onClick={() => void handleDisconnectSession()}>
                  세션 끊기
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
                layout={officeLayout}
                session={session}
                sessions={sessions}
                selectedPeerId={selectedPeerId}
                onSelectPeer={handleSelectPeer}
                onMove={(direction) => void handleMove(direction)}
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
                    좌표(0-base): ({visibleSessionPosition?.positionX}, {visibleSessionPosition?.positionY}) · 상태: {session.status}
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
                      onClick={() => handleSelectPeer(candidate.id)}
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
                        좌표(0-base): (
                        {visibleArea
                          ? getVisibleCharacterPosition(candidate, visibleArea).positionX
                          : candidate.positionX},{" "}
                        {visibleArea
                          ? getVisibleCharacterPosition(candidate, visibleArea).positionY
                          : candidate.positionY}) ·{" "}
                        {candidate.status}
                      </div>
                    </button>
                  ))}
                </div>

                {currentPeer ? (
                  <div className="footer-note">
                    {canOpenConversation
                      ? "마주보는 상태라 대화방을 열 수 있습니다."
                      : "현재 위치/방향에서는 대화방을 열 수 없습니다."}
                  </div>
                ) : null}

                <div className="button-row" style={{ marginTop: 14 }}>
                  <button
                    className="button"
                    type="button"
                    disabled={!canOpenConversation}
                    onClick={() => void handleOpenConversation()}
                  >
                    대화 열기
                  </button>
                  <button className="button button-secondary" type="button" onClick={clearConversation}>
                    채팅 닫기
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => void handleDisconnectSession()}>
                    세션 끊기
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
              onSendMessage={() => void handleSendMessage()}
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
