"use client";

import type { CSSProperties } from "react";
import type { DeveloperSession, Room } from "@/lib/types";
import { TOWN_TILE_SIZE, getObjectStyle } from "@/lib/town-rendering";
import type { OfficeObject } from "@/lib/town-layout";
import { TownCharacter } from "./town-character";

type TownMapProps = {
  room: Room;
  sessions: DeveloperSession[];
  currentSessionId: string;
  selectedPeerId: string | null;
  activeConversationPeerIds: string[];
  blockedTiles: Set<string>;
  objects: OfficeObject[];
  onSelectPeer: (session: DeveloperSession) => void;
};

export function TownMap({
  room,
  sessions,
  currentSessionId,
  selectedPeerId,
  activeConversationPeerIds,
  blockedTiles,
  objects,
  onSelectPeer,
}: TownMapProps) {
  return (
    <section className="panel town-stage-panel">
      <div className="panel-inner">
        <div className="town-stage__header">
          <div>
            <h2 className="panel-title">사무실 맵</h2>
            <p className="panel-subtitle">
              타일 기반 배경 위에 책상, 회의실, 식물, 캐릭터를 겹쳐 배치합니다.
            </p>
          </div>
          <div className="town-legend">
            <span className="chip">tile {TOWN_TILE_SIZE}px</span>
            <span className="chip chip-success">blocked tiles</span>
            <span className="chip chip-warning">chat ready</span>
          </div>
        </div>

        <div
          className="town-map"
          style={
            {
              width: `${room.width * TOWN_TILE_SIZE}px`,
              height: `${room.height * TOWN_TILE_SIZE}px`,
            } as CSSProperties
          }
        >
          <div
            className="town-map__floor"
            style={
              {
                display: "grid",
                gridTemplateColumns: `repeat(${room.width}, 1fr)`,
                gridTemplateRows: `repeat(${room.height}, 1fr)`,
              } as CSSProperties
            }
          >
            {Array.from({ length: room.width * room.height }, (_, index) => {
              const x = index % room.width;
              const y = Math.floor(index / room.width);
              const blocked = blockedTiles.has(`${x}:${y}`);

              return (
                <div
                  key={`${x}:${y}`}
                  className={`town-tile ${blocked ? "town-tile--blocked" : ""}`}
                  aria-hidden="true"
                />
              );
            })}
          </div>

          <div className="town-map__decor" aria-hidden="true">
            {objects.map((object) => (
              <div
                key={object.id}
                className={`town-object town-object--${object.kind}`}
                style={getObjectStyle(object.x, object.y, object.width, object.height)}
                title={object.label}
              >
                <span className="town-object__label">{object.label}</span>
                {renderObjectAccent(object.kind)}
              </div>
            ))}
          </div>

          <div className="town-map__characters">
            {sessions.map((session) => (
              <TownCharacter
                key={session.id}
                session={session}
                isSelected={session.id === selectedPeerId}
                isChatting={activeConversationPeerIds.includes(session.id)}
                onSelect={session.id === currentSessionId ? undefined : () => onSelectPeer(session)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function renderObjectAccent(kind: OfficeObject["kind"]) {
  switch (kind) {
    case "meetingRoom":
      return <span className="town-object__accent town-object__accent--meeting" />;
    case "wall":
      return <span className="town-object__accent town-object__accent--wall" />;
    case "desk":
      return <span className="town-object__accent town-object__accent--desk" />;
    case "chair":
      return <span className="town-object__accent town-object__accent--chair" />;
    case "plant":
      return <span className="town-object__accent town-object__accent--plant" />;
    case "cabinet":
      return <span className="town-object__accent town-object__accent--cabinet" />;
    case "whiteboard":
      return <span className="town-object__accent town-object__accent--board" />;
    case "door":
      return <span className="town-object__accent town-object__accent--door" />;
    case "reception":
      return <span className="town-object__accent town-object__accent--reception" />;
    case "lounge":
      return <span className="town-object__accent town-object__accent--lounge" />;
    default:
      return null;
  }
}
