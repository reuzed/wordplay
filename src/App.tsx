import { useEffect, useRef, useState, useCallback } from "react";

// ============================================
// BEHAVIOR CONFIGURATION
// ============================================

type SegmentBehavior = {
  getDefaultResolution: (text: string) => string;
  showResolutionInput: boolean;
  resolutionEditable: boolean;
  showWordplaySelector: boolean;
};

const segmentBehaviors: Record<string, SegmentBehavior> = {
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

// ============================================
// TYPES
// ============================================

type Mode = {
  key: string;
  name: string;
  style: string;
  selectedStyle?: string;
  behaviorKey: keyof typeof segmentBehaviors;
};

type WordplayType = {
  key: string;
  name: string;
  symbol: string;
};

type Segment = {
  id: string;
  start: number;
  end: number;
  text: string;
  mode: Mode;
  resolution: string;
  wordplayType?: WordplayType;
};

type SpanPosition = {
  segmentId: string;
  left: number;
  right: number;
  center: number;
  top: number;
  bottom: number;
};

// ============================================
// DATA
// ============================================

const modes: Mode[] = [
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

const wordplayTypes: WordplayType[] = [
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

// ============================================
// COMPONENTS
// ============================================

type WordplaySelectorProps = {
  value?: WordplayType;
  onChange: (type: WordplayType | undefined) => void;
  className?: string;
};

function WordplaySelector({
  value,
  onChange,
  className = "",
}: WordplaySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xl text-pink-500 hover:opacity-80 transition-opacity"
      >
        {value?.name || "?"}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 
          bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 py-1 min-w-32"
        >
          {wordplayTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => {
                onChange(type);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-pink-500 
                hover:bg-gray-800 transition-colors
                ${value?.key === type.key ? "bg-gray-800" : ""}`}
            >
              {type.name}
            </button>
          ))}
          {value && (
            <>
              <div className="border-t border-gray-700 my-1" />
              <button
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-gray-500 
                  hover:bg-gray-800 transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type WordSelectorProps = {
  text: string;
  className: string;
  segments: Segment[];
  onSelect: (start: number, end: number) => void;
  onPositionsChange: (positions: SpanPosition[]) => void;
};

function WordSelector({
  text,
  className,
  segments,
  onSelect,
  onPositionsChange,
}: WordSelectorProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const spanRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // non-breaking space: \u00A0
  // zero width non-breaking space: \uFEFF
  const paddedText = "\uFEFF" + text;

  // Build styles array from segments
  const styles = text.split("").map(() => "");
  segments.forEach((seg) => {
    for (let i = seg.start; i <= seg.end; i++) {
      styles[i] = seg.mode.style;
    }
  });
  const paddedStyles = [""].concat(styles);

  // Calculate positions when segments change
  useEffect(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const positions: SpanPosition[] = [];

    segments.forEach((segment) => {
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;

      for (let i = segment.start; i <= segment.end; i++) {
        const span = spanRefs.current.get(i + 1); // +1 for padding
        if (span) {
          const rect = span.getBoundingClientRect();
          left = Math.min(left, rect.left - containerRect.left);
          right = Math.max(right, rect.right - containerRect.left);
          top = Math.min(top, rect.top - containerRect.top);
          bottom = Math.max(bottom, rect.bottom - containerRect.top);
        }
      }

      if (left !== Infinity) {
        positions.push({
          segmentId: segment.id,
          left,
          right,
          center: (left + right) / 2,
          top,
          bottom,
        });
      }
    });

    onPositionsChange(positions);
  }, [segments, text, onPositionsChange]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (!containerRef.current?.contains(range.commonAncestorContainer))
        return;

      let startEl = range.startContainer;
      let endEl = range.endContainer;

      if (startEl.nodeType === Node.TEXT_NODE) startEl = startEl.parentElement!;
      if (endEl.nodeType === Node.TEXT_NODE) endEl = endEl.parentElement!;

      const startIndex = (startEl as HTMLElement).dataset.index;
      const endIndex = (endEl as HTMLElement).dataset.index;

      if (startIndex && endIndex) {
        let start = parseInt(startIndex);
        let end = parseInt(endIndex);
        if (start > end) [start, end] = [end, start];
        onSelect(start, end);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [onSelect]);

  return (
    <span ref={containerRef} className="relative">
      {paddedText.split("").map((char, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) spanRefs.current.set(index, el);
          }}
          data-index={index}
          className={className + " " + paddedStyles[index]}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

type ResolutionRowProps = {
  segments: Segment[];
  positions: SpanPosition[];
  onResolutionChange: (id: string, resolution: string) => void;
  onWordplayTypeChange: (id: string, type: WordplayType | undefined) => void;
};

function ResolutionRow({
  segments,
  positions,
  onResolutionChange,
  onWordplayTypeChange,
}: ResolutionRowProps) {
  return (
    <div className="relative h-24">
      {/* SVG layer for lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {segments.map((segment) => {
          const pos = positions.find((p) => p.segmentId === segment.id);
          const behavior = segmentBehaviors[segment.mode.behaviorKey];
          if (!pos) return null;
          if (!behavior.showResolutionInput && !behavior.showWordplaySelector)
            return null;

          // Convert tailwind color class to stroke
          const strokeClass =
            segment.mode.style.replace("text-", "stroke-") || "stroke-gray-500";

          return (
            <line
              key={segment.id}
              x1={pos.center}
              y1={0}
              x2={pos.center}
              y2={20}
              strokeWidth={1}
              className={strokeClass}
            />
          );
        })}
      </svg>

      {/* Input layer */}
      {segments.map((segment) => {
        const pos = positions.find((p) => p.segmentId === segment.id);
        const behavior = segmentBehaviors[segment.mode.behaviorKey];
        if (!pos) return null;
        if (!behavior.showResolutionInput && !behavior.showWordplaySelector)
          return null;

        return (
          <div
            key={segment.id}
            className="absolute flex flex-col items-center"
            style={{
              left: pos.center,
              top: 20,
              transform: "translateX(-50%)",
            }}
          >
            {behavior.showResolutionInput && (
              <input
                className={`w-24 text-xl text-center bg-transparent outline-none 
                  ${segment.mode.style}
                  ${behavior.resolutionEditable ? "focus:bg-white/5 rounded" : "opacity-80"}`}
                value={segment.resolution}
                placeholder="..."
                readOnly={!behavior.resolutionEditable}
                onChange={(e) => onResolutionChange(segment.id, e.target.value)}
              />
            )}
            {behavior.showWordplaySelector && (
              <WordplaySelector
                value={segment.wordplayType}
                onChange={(type) => onWordplayTypeChange(segment.id, type)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type ModeSelectorProps = {
  modes: Mode[];
  currentMode: Mode | null;
  onModeChange: (mode: Mode) => void;
};

function ModeSelector({ modes, currentMode, onModeChange }: ModeSelectorProps) {
  const unselectedStyle = "border-gray-500 bg-white/10";
  const selectedStyle = (mode: Mode) =>
    (mode.selectedStyle ?? "") + " border-black scale-105 -translate-y-1";

  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => onModeChange(mode)}
          className={`px-3 py-1 rounded border transition-all
            ${currentMode?.key === mode.key ? selectedStyle(mode) : unselectedStyle}`}
        >
          <span className={mode.style}>{mode.name}</span>
          <span className="ml-2 text-gray-500 text-sm">({mode.key})</span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// APP
// ============================================

function App() {
  const clues = [
    "A lot to change for singer (4)",
    "Without guidance, I'd fart carelessly (6)",
    "Generous family with diamonds (4) ",
    "See Pat counterfeit old Spanish coin (6)",
    "You and I will correct outspoken craftsman (11)",
    "Patriots tussling with cop to get snack item (6,5)",
    "Himalayan's unusual phrase (6)",
    "Picked up lazy hero (4)",
    "Pass the Spanish recess in church (6)",
    "Studies deepness regularly (4)",
  ];
  const text = clues[5];

  const [segments, setSegments] = useState<Segment[]>([]);
  const [positions, setPositions] = useState<SpanPosition[]>([]);
  const [currentMode, setCurrentMode] = useState<Mode>(modes[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addOrUpdateSegment = (start: number, end: number) => {
    if (currentMode.behaviorKey === "clear") {
      setSegments((prev) => prev.filter((s) => s.end < start || s.start > end));
      return;
    }

    const segmentText = text.slice(start, end + 1);
    const behavior = segmentBehaviors[currentMode.behaviorKey];
    const defaultResolution = behavior.getDefaultResolution(segmentText);

    const existingIndex = segments.findIndex(
      (s) => s.start === start && s.end === end,
    );

    if (existingIndex >= 0) {
      setSegments((prev) =>
        prev.map((s, i) =>
          i === existingIndex
            ? {
                ...s,
                mode: currentMode,
                resolution: behavior.getDefaultResolution(s.text),
              }
            : s,
        ),
      );
    } else {
      setSegments((prev) => [
        ...prev.filter((s) => s.end < start || s.start > end),
        {
          id: crypto.randomUUID(),
          start,
          end,
          text: segmentText,
          mode: currentMode,
          resolution: defaultResolution,
        },
      ]);
    }
  };

  const updateResolution = (id: string, resolution: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, resolution } : s)),
    );
  };

  const updateWordplayType = (
    id: string,
    wordplayType: WordplayType | undefined,
  ) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, wordplayType } : s)),
    );
  };

  const handlePositionsChange = useCallback((newPositions: SpanPosition[]) => {
    setPositions(newPositions);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== document.body
      ) {
        return;
      }

      const mode = modes.find((m) => m.key === e.key.toLowerCase());
      if (mode) {
        setCurrentMode(mode);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build summary
  const summary = segments
    .filter((s) => s.resolution || s.wordplayType)
    .sort((a, b) => a.start - b.start)
    .map((s) => {
      if (s.wordplayType) return s.wordplayType.name;
      return s.resolution;
    })
    .join(" → ");

  return (
    <div className="h-screen w-screen flex justify-center align-middle">
      <div ref={containerRef} className="self-center flex flex-col gap-4">
        <ModeSelector
          modes={modes}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />
        <div>
          <WordSelector
            text={text}
            className="text-2xl"
            segments={segments}
            onSelect={(s, e) => {
              if (s === e) return;
              addOrUpdateSegment(s, e - 1);
            }}
            onPositionsChange={handlePositionsChange}
          />
          <ResolutionRow
            segments={segments}
            positions={positions}
            onResolutionChange={updateResolution}
            onWordplayTypeChange={updateWordplayType}
          />
        </div>
        <div className="text-gray-500 text-xl">{summary}</div>
      </div>
    </div>
  );
}

export default App;
