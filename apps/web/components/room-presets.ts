export type RoomPresetId = "office";

export type RoomPreset = {
  id: RoomPresetId;
  label: string;
  width: number;
  height: number;
};

export const OFFICE_ROOM_PRESET: RoomPreset = {
  id: "office",
  label: "사무실",
  width: 12,
  height: 11,
};

export const ROOM_PRESETS: RoomPreset[] = [OFFICE_ROOM_PRESET];
