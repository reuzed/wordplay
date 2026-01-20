import { useEffect, useRef, useState } from "react";

type WordSelectorProps = {
  text: string;
  className: string;
  styles: Array<string>;
  onSelect: (start: number, end: number) => void;
};

function WordSelector({
  text,
  className,
  styles,
  onSelect,
}: WordSelectorProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  // Finding first element is hard so add an ignorable first character
  // non-breaking space: \u00A0
  // zero width non-breaking space: \uFEFF
  const paddedText = "\uFEFF" + text;
  const paddedStyles = [""].concat(styles);

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
    <span ref={containerRef}>
      {paddedText.split("").map((char, index) => (
        <span
          key={index}
          data-index={index}
          className={className + " " + paddedStyles[index]}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

type Mode = {
  key: string;
  name: string;
  style: string;
};

const modes: Mode[] = [
  {
    key: "-",
    name: "Clear",
    style: "",
  },
  {
    key: "f",
    name: "Fodder",
    style: "text-yellow-500",
  },
  {
    key: "p",
    name: "Plain",
    style: "underline",
  },
  {
    key: "s",
    name: "Synonym",
    style: "text-green-500",
  },
  {
    key: "a",
    name: "Abbreviation",
    style: "text-green-700",
  },
  {
    key: "w",
    name: "Wordplay Indicator",
    style: "text-pink-500",
  },
  {
    key: "t",
    name: "Wordplay Target",
    style: "text-gray-500",
  },
  {
    key: "d",
    name: "Definition",
    style: "text-red-500",
  },
];

type ModeSelectorProps = {
  modes: Mode[];
  currentMode: Mode | null;
  onModeChange: (mode: Mode) => void;
};

function ModeSelector({ modes, currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-row gap-2">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => onModeChange(mode)}
          className={`
            px-3 py-1 rounded border transition-all
            ${
              currentMode?.key === mode.key
                ? "border-gray-600 hover:border-gray-400"
                : "border-white bg-white/20"
            }
          `}
        >
          <span className={mode.style}>{mode.name}</span>
          <span className="ml-2 text-gray-500 text-sm">({mode.key})</span>
        </button>
      ))}
    </div>
  );
}

function useStateArray<T>(initial: T[]) {
  const [array, setArray] = useState(initial);

  const setItem = (item: T, index: number) => {
    setArray((prev) => {
      const newArray = [...prev];
      newArray[index] = item;
      return newArray;
    });
  };

  const setSlice = (item: T, start: number, end: number) => {
    setArray((prev) => {
      console.log(prev);
      const newArray = [...prev];
      for (let i = start; i <= end; i++) {
        newArray[i] = item;
      }
      console.log(newArray);
      return newArray;
    });
  };

  return [array, setItem, setSlice] as const;
}

function getEmptyStyles(text: string) {
  return text.split("").map(() => "");
}

function App() {
  const clues = [
    "A lot to change for singer (4)",
    "Without guidance, I’d fart carelessly (6)",
    "Generous family with diamonds (4) ",
    "See Pat counterfeit old Spanish coin (6)",
    "You and I will correct outspoken craftsman (11)",
    "Patriots tussling with cop to get snack item (6,5)",
    "Himalayan’s unusual phrase (6)",
    "Picked up lazy hero (4)",
    "Pass the Spanish recess in church (6)",
    "Studies deepness regularly (4)",
  ];
  const text = clues[0];

  const [styles, _setStyleN, setStylesSlice] = useStateArray(
    getEmptyStyles(text),
  );
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [currentMode, setCurrentMode] = useState<Mode | null>(modes[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond if focus is within our container
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

  const onSelect = (s: number, e: number) => {
    if (currentMode) {
      setStylesSlice(currentMode.style, s, e - 1);
    }
  };

  return (
    <div className="h-screen w-screen flex justify-center align-middle">
      <div ref={containerRef} className="self-center flex flex-col gap-4">
        <ModeSelector
          modes={modes}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />
        <WordSelector
          text={text}
          className="text-4xl"
          styles={styles}
          onSelect={(s, e) => {
            if (s == e) {
              return;
            }
            setStart(s);
            setEnd(e);
            onSelect(s, e);
          }}
        />
        <div className="text-gray-500">
          Selection: {start} - {end}
        </div>
      </div>
    </div>
  );
}

export default App;
