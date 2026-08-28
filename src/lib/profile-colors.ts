export const PROFILE_COLORS = [
  "INDIGO",
  "GREEN",
  "ORANGE",
  "PINK",
  "TEAL",
  "LAVENDER",
  "GOLD",
  "GRAPHITE",
] as const;

export type ProfileColor = (typeof PROFILE_COLORS)[number];

export const PROFILE_COLOR_HEX: Record<ProfileColor, string> = {
  INDIGO: "#3D4FE0",
  GREEN: "#17835B",
  ORANGE: "#E0562B",
  PINK: "#B23B7A",
  TEAL: "#0F9AA6",
  LAVENDER: "#8E7CF5",
  GOLD: "#C79A2E",
  GRAPHITE: "#4B5563",
};

export const PROFILE_COLOR_LABEL: Record<ProfileColor, string> = {
  INDIGO: "Índigo",
  GREEN: "Verde",
  ORANGE: "Naranja",
  PINK: "Rosa",
  TEAL: "Turquesa",
  LAVENDER: "Lavanda",
  GOLD: "Dorado",
  GRAPHITE: "Grafito",
};

export function isProfileColor(value: string): value is ProfileColor {
  return (PROFILE_COLORS as readonly string[]).includes(value);
}
