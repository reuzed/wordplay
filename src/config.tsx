// config.ts
import type { SegmentBehavior, Mode, WordplayType } from "./types";

export const segmentBehaviors: Record<string, SegmentBehavior> = {
  fodder: {
    getDefaultResolution: (text) =>
      text.replace(/\s/g, "").toUpperCase().split("").join(""),
    showResolutionInput: true,
    resolutionEditable: false,
    showWordplaySelector: false,
  },
  synonym: {
    getDefaultResolution: () => "",
    showResolutionInput: true,
    resolutionEditable: true,
    showWordplaySelector: false,
  },
  abbreviation: {
    getDefaultResolution: (text) =>
      text
        .split(/\s+/)
        .map((word) => word[0] || "")
        .join("")
        .toUpperCase(),
    showResolutionInput: true,
    resolutionEditable: true,
    showWordplaySelector: false,
  },
  wordplayIndicator: {
    getDefaultResolution: () => "",
    showResolutionInput: false,
    resolutionEditable: false,
    showWordplaySelector: true,
  },
  definition: {
    getDefaultResolution: () => "",
    showResolutionInput: true,
    resolutionEditable: true,
    showWordplaySelector: false,
  },
  clear: {
    getDefaultResolution: () => "",
    showResolutionInput: false,
    resolutionEditable: false,
    showWordplaySelector: false,
  },
};

export const modes: Mode[] = [
  { key: "-", name: "Clear", style: "", behaviorKey: "clear" },
  { key: "f", name: "Fodder", style: "text-yellow-500", behaviorKey: "fodder" },
  {
    key: "w",
    name: "Wordplay Indicator",
    style: "text-pink-500",
    behaviorKey: "wordplayIndicator",
  },
  {
    key: "s",
    name: "Synonym",
    style: "text-green-500",
    selectedStyle: "bg-green-500/10",
    behaviorKey: "synonym",
  },
  {
    key: "a",
    name: "Abbreviation",
    style: "text-green-700",
    behaviorKey: "abbreviation",
  },
  {
    key: "d",
    name: "Definition",
    style: "text-red-500",
    behaviorKey: "definition",
  },
];

export const wordplayTypes: WordplayType[] = [
  { key: "anag", name: "Anagram", symbol: "⟳" },
  { key: "rev", name: "Reversal", symbol: "←" },
  { key: "cont", name: "Container", symbol: "⊂" },
  { key: "hid", name: "Hidden", symbol: "…" },
  { key: "del", name: "Deletion", symbol: "✂" },
  { key: "first", name: "First letter", symbol: "↑" },
  { key: "last", name: "Last letter", symbol: "↓" },
  { key: "homo", name: "Homophone", symbol: "♪" },
  { key: "other", name: "Other wordplay", symbol: "?" },
];
