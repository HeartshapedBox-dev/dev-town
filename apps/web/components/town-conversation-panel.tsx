"use client";

import type { ChatMessage, Conversation, DeveloperSession } from "@/lib/types";

type TownConversationPanelProps = {
  conversation: Conversation | null;
  messages: ChatMessage[];
  currentSession: DeveloperSession;
  draft: string;
  onDraftChange: (value: string) => void;
  onSendMessage: () => void;
};

export function TownConversationPanel({
  conversation,
  messages,
  currentSession,
  draft,
  onDraftChange,
  onSendMessage,
}: TownConversationPanelProps) {
  return (
    <section className="panel town-conversation-panel">
      <div className="panel-inner">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">대화 패널</h2>
            <p className="panel-subtitle">서로 마주보면 열리고, 멀어지면 닫힙니다.</p>
          </div>
          {conversation ? (
            <span className="chip chip-success">conversation {conversation.id.slice(0, 8)}</span>
          ) : (
            <span className="chip">대기 중</span>
          )}
        </div>

        {conversation ? (
          <div className="town-conversation">
            <div className="town-conversation__messages">
              {messages.length > 0 ? (
                messages.map((message) => {
                  const isMine = message.senderId === currentSession.id;

                  return (
                    <article key={message.id} className={`town-message ${isMine ? "town-message--mine" : ""}`}>
                      <div className="town-message__body">{message.body}</div>
                      <div className="town-message__meta">
                        <span>{isMine ? "나" : message.senderId}</span>
                        <span>
                          {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="town-empty">메시지가 없습니다.</div>
              )}
            </div>

            <label className="field">
              <span className="field-label">메시지</span>
              <textarea
                className="textarea town-conversation__input"
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder="메시지를 입력하세요."
                maxLength={1000}
              />
            </label>

            <div className="button-row">
              <button className="button" type="button" onClick={onSendMessage} disabled={!draft.trim()}>
                보내기
              </button>
            </div>
          </div>
        ) : (
          <div className="town-empty town-empty--panel">
            마주보는 상대를 선택하면 대화가 열립니다.
          </div>
        )}
      </div>
    </section>
  );
}
