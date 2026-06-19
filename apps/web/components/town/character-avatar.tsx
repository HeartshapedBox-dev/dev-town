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
      viewBox="0 0 80 108"
      role="img"
      aria-label={label}
      className={selected ? `${styles.avatar} ${styles.selected}` : styles.avatar}
      data-direction={direction}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.66" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="98" rx="18" ry="5.5" fill="rgba(0, 0, 0, 0.28)" />
      <g transform={avatarTransform(direction)}>
        <circle cx="40" cy="25" r="15" fill="#f1d4c4" />
        <path
          d="M25 27c0-13 11-23 23-23s23 10 23 23c0 2-1 5-2 6-4-7-10-12-21-12s-17 4-21 12c-1-2-2-4-2-6Z"
          fill="rgba(35, 24, 18, 0.92)"
        />
        <path
          d="M30 43c3-3 8-6 10-6h0c2 0 7 3 10 6 3 4 6 11 6 18v25H24V61c0-7 3-14 6-18Z"
          fill={`url(#${gradientId})`}
        />
        <path d="M21 53c4 0 9 3 13 8l-4 5c-5-4-8-5-12-5-3 0-5 1-7 3l-3-4c3-4 8-7 13-7Z" fill={color} opacity="0.9" />
        <path d="M59 53c5 0 10 3 13 7l-3 4c-2-2-4-3-7-3-4 0-7 1-12 5l-4-5c4-5 9-8 13-8Z" fill={color} opacity="0.9" />
        <rect x="29" y="65" width="9" height="26" rx="4.5" fill="#2f3a4a" />
        <rect x="42" y="65" width="9" height="26" rx="4.5" fill="#2f3a4a" />
        <rect x="24" y="89" width="14" height="7" rx="3.5" fill="#202734" />
        <rect x="42" y="89" width="14" height="7" rx="3.5" fill="#202734" />
        <circle cx="34" cy="25" r="2.5" fill="#3d2a24" opacity="0.95" />
        <circle cx="46" cy="25" r="2.5" fill="#3d2a24" opacity="0.95" />
        <path d="M34 32c2 2 10 2 12 0" fill="none" stroke="#b05a5a" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function avatarTransform(direction: CharacterAvatarProps["direction"]) {
  switch (direction) {
    case "UP":
      return "translate(0 0) scale(1 0.98)";
    case "LEFT":
      return "translate(0 0)";
    case "RIGHT":
      return "translate(0 0) scaleX(-1)";
    case "DOWN":
    default:
      return "translate(0 0)";
  }
}
