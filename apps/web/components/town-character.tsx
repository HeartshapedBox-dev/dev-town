"use client";

import type { CSSProperties } from "react";
import { directionArrow } from "@/lib/facing";
import { getTileCenter, TOWN_TILE_SIZE } from "@/lib/town-rendering";
import type { DeveloperSession } from "@/lib/types";

type TownCharacterProps = {
  session: DeveloperSession;
  isSelected: boolean;
  isChatting: boolean;
  onSelect?: () => void;
};

export function TownCharacter({ session, isSelected, isChatting, onSelect }: TownCharacterProps) {
  const position = getTileCenter(session.positionX, session.positionY, TOWN_TILE_SIZE);
  const style: CSSProperties = {
    left: `${position.left}px`,
    top: `${position.top}px`,
    color: session.avatarColor,
  };

  return (
    <button
      type="button"
      className={`town-character ${isSelected ? "town-character--selected" : ""} ${isChatting ? "town-character--chatting" : ""}`}
      style={style}
      onClick={onSelect}
      disabled={!onSelect}
      aria-label={`${session.displayName} ${directionArrow(session.direction)}`}
    >
      <span className="town-character__name">{session.displayName}</span>
      <span className="town-character__direction">{directionArrow(session.direction)}</span>
      <svg className="town-character__svg" viewBox="0 0 64 88" role="img" aria-hidden="true">
        <g className={`town-character__figure town-character__figure--${session.direction.toLowerCase()}`}>
          <ellipse cx="32" cy="68" rx="16" ry="8" fill="rgba(5, 10, 20, 0.3)" />
          <circle cx="32" cy="20" r="12" fill="currentColor" opacity="0.96" />
          <rect x="22" y="32" width="20" height="24" rx="10" fill="currentColor" opacity="0.92" />
          <path d="M22 36 L12 44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M42 36 L52 44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M27 54 L22 72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M37 54 L42 72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <circle cx="28" cy="18" r="2.2" fill="#0f172a" />
          <circle cx="36" cy="18" r="2.2" fill="#0f172a" />
          <path d="M28 25 Q32 28 36 25" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <span className="town-character__status">{isChatting ? "chatting" : session.status.toLowerCase()}</span>
    </button>
  );
}
