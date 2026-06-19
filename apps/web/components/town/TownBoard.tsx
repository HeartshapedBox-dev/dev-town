"use client";

import type { DeveloperSession, Direction, Room } from "@/lib/types";
import { CharacterAvatar } from "./character-avatar";
import {
  buildOfficeLayout,
  createTileKey,
  getFurnitureClassName,
  getTileClassName,
} from "./office-map";
import styles from "./town-board.module.css";

type TownBoardProps = {
  room: Room;
  session: DeveloperSession;
  sessions: DeveloperSession[];
  selectedPeerId: string | null;
  onSelectPeer: (sessionId: string | null) => void;
  onMove: (direction: Direction) => void;
  connectionState: "idle" | "connecting" | "connected" | "disconnected";
  blockedNotice: string | null;
};

const TILE_PX = 64;

export function TownBoard({
  room,
  session,
  sessions,
  selectedPeerId,
  onSelectPeer,
  onMove,
  connectionState,
  blockedNotice,
}: TownBoardProps) {
  const layout = buildOfficeLayout(room.width, room.height);

  return (
    <section className={styles.panel}>
      <div className={styles.frame}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Dev Town / office map</span>
            <h2 className={styles.title}>{room.name}</h2>
            <p className={styles.subtitle}>
              {room.inviteCode} · {room.width} x {room.height}
            </p>
          </div>

          <div className={styles.meta}>
            <span className={styles.legend}>벽 프레임</span>
            <span className={styles.legend}>타일 기반 오피스</span>
            <span className={styles.legend}>사람형 SVG 캐릭터</span>
          </div>
        </div>

        <div className={styles.boardShell}>
          <div className={styles.boardFrame}>
            <div className={styles.wallTop} />
            <div className={styles.wallLeft} />
            <div className={styles.wallRight} />
            <div className={styles.wallBottom} />
            <div className={styles.officeLabel}>Office Floor</div>

            <div
              className={styles.tileGrid}
              style={{
                width: room.width * TILE_PX,
                height: room.height * TILE_PX,
                gridTemplateColumns: `repeat(${room.width}, 1fr)`,
                gridTemplateRows: `repeat(${room.height}, 1fr)`,
              }}
            >
              {layout.tiles.map((tile) => (
                <div
                  key={createTileKey(tile.x, tile.y)}
                  className={`${styles.tile} ${styles[getTileClassName(tile.kind)]}`}
                  aria-hidden="true"
                />
              ))}
            </div>

            <div className={styles.furnitureLayer} aria-hidden="true">
              {layout.furniture.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.furniture} ${styles[getFurnitureClassName(item.kind)]}`}
                  style={{
                    left: `${(item.x / room.width) * 100}%`,
                    top: `${(item.y / room.height) * 100}%`,
                    width: `${(item.width / room.width) * 100}%`,
                    height: `${(item.height / room.height) * 100}%`,
                    zIndex: item.layer === "front" ? 3 : 2,
                  }}
                >
                  <span className={styles.furnitureLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.characterLayer}>
              {sessions.map((candidate) => {
                const isCurrent = candidate.id === session.id;
                const isSelected = candidate.id === selectedPeerId;
                const left = `${((candidate.positionX + 0.5) / room.width) * 100}%`;
                const top = `${((candidate.positionY + 0.5) / room.height) * 100}%`;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    className={[
                      styles.character,
                      isCurrent ? styles.characterCurrent : "",
                      isSelected ? styles.characterSelected : "",
                    ].join(" ")}
                    style={{
                      left,
                      top,
                    }}
                    onClick={() => onSelectPeer(candidate.id === session.id ? null : candidate.id)}
                    title={`${candidate.displayName} · ${candidate.positionX}, ${candidate.positionY}`}
                  >
                    <span className={styles.badge} style={{ background: candidate.avatarColor }} />
                    <CharacterAvatar
                      direction={candidate.direction}
                      color={candidate.avatarColor}
                      selected={isSelected}
                      label={`${candidate.displayName} 캐릭터`}
                    />
                    <span className={styles.characterName}>{candidate.displayName}</span>
                    <span className={styles.characterMeta}>
                      {candidate.positionX + 1}, {candidate.positionY + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.boardFooter}>
          <div className={styles.statusPill}>
            연결 상태: {connectionState}
          </div>
          <div className={styles.statusPill}>
            {blockedNotice ?? "방향 키 또는 버튼으로 이동할 수 있습니다."}
          </div>
          <div className={styles.meta}>
            <button className="button button-secondary" type="button" onClick={() => onMove("UP")}>
              위
            </button>
            <button className="button button-secondary" type="button" onClick={() => onMove("LEFT")}>
              왼쪽
            </button>
            <button className="button button-secondary" type="button" onClick={() => onMove("DOWN")}>
              아래
            </button>
            <button className="button button-secondary" type="button" onClick={() => onMove("RIGHT")}>
              오른쪽
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
