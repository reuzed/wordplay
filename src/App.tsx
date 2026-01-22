// App.tsx
import { useState } from "react";
import { ClueHighlighter } from "./ClueHighlighter";
import type { ClueData, Segment } from "./types";

const initialClues: ClueData[] = [
  {
    id: "1a",
    number: "1",
    direction: "across",
    text: "A lot to change for singer (4)",
    segments: [],
  },
  {
    id: "4a",
    number: "4",
    direction: "across",
    text: "Without guidance, I'd fart carelessly (6)",
    segments: [],
  },
  {
    id: "7a",
    number: "7",
    direction: "across",
    text: "Generous family with diamonds (4)",
    segments: [],
  },
  {
    id: "8a",
    number: "8",
    direction: "across",
    text: "See Pat counterfeit old Spanish coin (6)",
    segments: [],
  },
  {
    id: "1d",
    number: "1",
    direction: "down",
    text: "You and I will correct outspoken craftsman (11)",
    segments: [],
  },
  {
    id: "2d",
    number: "2",
    direction: "down",
    text: "Patriots tussling with cop to get snack item (6,5)",
    segments: [],
  },
  {
    id: "3d",
    number: "3",
    direction: "down",
    text: "Himalayan's unusual phrase (6)",
    segments: [],
  },
  {
    id: "5d",
    number: "5",
    direction: "down",
    text: "Picked up lazy hero (4)",
    segments: [],
  },
  {
    id: "6d",
    number: "6",
    direction: "down",
    text: "Pass the Spanish recess in church (6)",
    segments: [],
  },
  {
    id: "9d",
    number: "9",
    direction: "down",
    text: "Studies deepness regularly (4)",
    segments: [],
  },
];

function ClueList({
  title,
  clues,
  selectedId,
  onSelect,
}: {
  title: string;
  clues: ClueData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-bold text-gray-400 uppercase text-sm tracking-wide mb-2">
        {title}
      </h3>
      {clues.map((clue) => {
        const isSelected = clue.id === selectedId;
        const hasSegments = clue.segments.length > 0;

        return (
          <button
            key={clue.id}
            onClick={() => onSelect(clue.id)}
            className={`text-left px-3 py-2 rounded transition-all flex gap-3
              ${
                isSelected
                  ? "bg-white/20 border border-gray-500"
                  : "hover:bg-white/5 border border-transparent"
              }
              ${hasSegments ? "opacity-100" : "opacity-70"}`}
          >
            <span className="text-gray-500 w-6">{clue.number}</span>
            <span className={hasSegments ? "text-white" : "text-gray-400"}>
              {clue.text}
            </span>
            {hasSegments && <span className="ml-auto text-green-500">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [clues, setClues] = useState<ClueData[]>(initialClues);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(
    initialClues[0].id,
  );

  const selectedClue = clues.find((c) => c.id === selectedClueId);

  const acrossClues = clues.filter((c) => c.direction === "across");
  const downClues = clues.filter((c) => c.direction === "down");

  const updateClueSegments = (clueId: string, segments: Segment[]) => {
    setClues((prev) =>
      prev.map((c) => (c.id === clueId ? { ...c, segments } : c)),
    );
  };

  const selectNextClue = () => {
    const currentIndex = clues.findIndex((c) => c.id === selectedClueId);
    const nextIndex = (currentIndex + 1) % clues.length;
    setSelectedClueId(clues[nextIndex].id);
  };

  const selectPrevClue = () => {
    const currentIndex = clues.findIndex((c) => c.id === selectedClueId);
    const prevIndex = (currentIndex - 1 + clues.length) % clues.length;
    setSelectedClueId(clues[prevIndex].id);
  };

  return (
    <div className="min-h-screen w-screen flex">
      {/* Clue list sidebar */}
      <div className="w-96 border-r border-gray-700 p-4 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <ClueList
            title="Across"
            clues={acrossClues}
            selectedId={selectedClueId}
            onSelect={setSelectedClueId}
          />
          <ClueList
            title="Down"
            clues={downClues}
            selectedId={selectedClueId}
            onSelect={setSelectedClueId}
          />
        </div>
      </div>

      {/* Main highlighter area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {selectedClue ? (
          <>
            <div className="text-gray-500 mb-2">
              {selectedClue.number} {selectedClue.direction}
            </div>
            <ClueHighlighter
              text={selectedClue.text}
              segments={selectedClue.segments}
              onSegmentsChange={(segments) =>
                updateClueSegments(selectedClue.id, segments)
              }
            />
            <div className="flex gap-4 mt-8">
              <button
                onClick={selectPrevClue}
                className="px-4 py-2 border border-gray-600 rounded hover:bg-white/10 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={selectNextClue}
                className="px-4 py-2 border border-gray-600 rounded hover:bg-white/10 transition-colors"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-500">Select a clue to begin</div>
        )}
      </div>
    </div>
  );
}

export default App;
