import { AtmosphereType, TrackMeta } from "../types";

export const ATMOSPHERE_TRACKS: TrackMeta[] = [
  {
    id: "glory",
    label: "Glory",
    description: "Triumphant orchestral swells with choir pads",
    bundled: true,
  },
  {
    id: "warfare",
    label: "Warfare",
    description: "Epic drums and cinematic percussion",
    bundled: true,
  },
  {
    id: "peace",
    label: "Peace",
    description: "Gentle piano and ambient strings",
    bundled: true,
  },
  {
    id: "rise",
    label: "Rise",
    description: "Building motivational crescendo",
    bundled: true,
  },
  {
    id: "selah",
    label: "Selah",
    description: "Meditative ambient stillness",
    bundled: true,
  },
  {
    id: "none",
    label: "Voice Only",
    description: "Declaration without background music",
    bundled: true,
  },
];

// Maps atmosphere IDs to bundled asset requires.
// Each track is a ~45 second loop, MP3 128kbps (~700KB each).
export const BUNDLED_TRACK_ASSETS: Partial<Record<AtmosphereType, number>> = {
  glory: require("../assets/tracks/glory.mp3"),
  warfare: require("../assets/tracks/warfare.mp3"),
  peace: require("../assets/tracks/peace.mp3"),
  rise: require("../assets/tracks/rise.mp3"),
  selah: require("../assets/tracks/selah.mp3"),
};
