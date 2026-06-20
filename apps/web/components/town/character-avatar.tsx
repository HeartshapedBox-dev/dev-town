import { useId } from "react";
import styles from "./character-avatar.module.css";

type CharacterAvatarProps = {
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  color: string;
  selected?: boolean;
  label: string;
};

export function CharacterAvatar({ direction, color, selected, label }: CharacterAvatarProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 48 64"
      role="img"
      aria-label={label}
      className={selected ? `${styles.avatar} ${styles.selected}` : styles.avatar}
      data-direction={direction}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.96" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="60" rx="13" ry="3" fill="rgba(0, 0, 0, 0.3)" />
      <g transform={avatarTransform(direction)}>
        {renderHead(direction)}
        <rect x="17" y="18" width="14" height="14" rx="2" fill={`url(#${gradientId})`} />
        <rect x="13" y="20" width="4" height="8" rx="1" fill={color} />
        <rect x="31" y="20" width="4" height="8" rx="1" fill={color} />
        <rect x="18" y="32" width="12" height="10" rx="1.5" fill="#2f3a4a" />
        <rect x="16" y="34" width="4" height="11" rx="1" fill="#2f3a4a" />
        <rect x="28" y="34" width="4" height="11" rx="1" fill="#2f3a4a" />
        <rect x="15" y="43" width="6" height="4" rx="1" fill="#202734" />
        <rect x="27" y="43" width="6" height="4" rx="1" fill="#202734" />
        <rect x="16" y="19" width="4" height="2" fill="#f5e6de" opacity="0.55" />
        <rect x="28" y="19" width="3" height="2" fill="#f5e6de" opacity="0.35" />
        <rect x="18" y="33" width="4" height="2" fill="#45556a" opacity="0.8" />
        <rect x="25" y="33" width="3" height="2" fill="#45556a" opacity="0.8" />
        <path d="M23 8 L25 11 L21 11 Z" fill="#ffffff" opacity="0.55" />
      </g>
    </svg>
  );
}

function avatarTransform(direction: CharacterAvatarProps["direction"]) {
  switch (direction) {
    case "UP":
      return "translate(0 0)";
    case "LEFT":
      return "translate(0 0)";
    case "RIGHT":
      return "translate(0 0) scaleX(-1)";
    case "DOWN":
    default:
      return "translate(0 0)";
  }
}

function renderHead(direction: CharacterAvatarProps["direction"]) {
  switch (direction) {
    case "UP":
      return (
        <>
          <rect x="17" y="6" width="14" height="7" rx="2" fill="rgba(35, 24, 18, 0.96)" />
          <rect x="18" y="11" width="12" height="8" rx="2" fill="#f1d4c4" />
          <rect x="20" y="13" width="8" height="2" rx="1" fill="#7c5847" opacity="0.45" />
          <rect x="21" y="17" width="6" height="1" rx="1" fill="#b05a5a" opacity="0.55" />
        </>
      );
    case "DOWN":
      return (
        <>
          <rect x="16" y="6" width="16" height="6" rx="2" fill="rgba(35, 24, 18, 0.96)" />
          <rect x="17" y="10" width="14" height="10" rx="3" fill="#f1d4c4" />
          <rect x="19" y="13" width="3" height="2" rx="1" fill="#3d2a24" />
          <rect x="26" y="13" width="3" height="2" rx="1" fill="#3d2a24" />
          <rect x="21" y="16" width="6" height="1.5" rx="1" fill="#b05a5a" />
        </>
      );
    case "LEFT":
      return (
        <>
          <rect x="16" y="7" width="13" height="6" rx="2" fill="rgba(35, 24, 18, 0.96)" />
          <rect x="17" y="11" width="11" height="9" rx="3" fill="#f1d4c4" />
          <rect x="18" y="13" width="3" height="2" rx="1" fill="#3d2a24" />
          <rect x="14" y="14" width="4" height="2" rx="1" fill="#7c5847" />
          <rect x="21" y="16" width="5" height="1.5" rx="1" fill="#b05a5a" />
        </>
      );
    case "RIGHT":
    default:
      return (
        <>
          <rect x="16" y="7" width="13" height="6" rx="2" fill="rgba(35, 24, 18, 0.96)" />
          <rect x="17" y="11" width="11" height="9" rx="3" fill="#f1d4c4" />
          <rect x="18" y="13" width="3" height="2" rx="1" fill="#3d2a24" />
          <rect x="14" y="14" width="4" height="2" rx="1" fill="#7c5847" />
          <rect x="21" y="16" width="5" height="1.5" rx="1" fill="#b05a5a" />
        </>
      );
  }
}
