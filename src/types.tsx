// types.ts
export type SegmentBehavior = {
  getDefaultResolution: (text: string) => string;
  showResolutionInput: boolean;
  resolutionEditable: boolean;
  showWordplaySelector: boolean;
};

export type Mode = {
  key: string;
  name: string;
  style: string;
  selectedStyle?: string;
  behaviorKey: string;
};

export type WordplayType = {
  key: string;
  name: string;
  symbol: string;
};

export type Segment = {
  id: string;
  start: number;
  end: number;
  text: string;
  mode: Mode;
  resolution: string;
  wordplayType?: WordplayType;
};

export type SpanPosition = {
  segmentId: string;
  left: number;
  right: number;
  center: number;
  top: number;
  bottom: number;
};

export type ClueData = {
  id: string;
  number: string;
  direction: "across" | "down";
  text: string;
  segments: Segment[];
};
