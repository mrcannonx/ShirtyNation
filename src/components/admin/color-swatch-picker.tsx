"use client";

const SHIRT_COLORS = [
  { id: "black", label: "Black", hex: "#1A1A1A" },
  { id: "white", label: "White", hex: "#FAFAFA" },
  { id: "navy", label: "Navy", hex: "#1E3A5F" },
  { id: "red", label: "Red", hex: "#DC2626" },
  { id: "forest", label: "Forest", hex: "#2D5016" },
  { id: "maroon", label: "Maroon", hex: "#6B1D1D" },
  { id: "dark-grey", label: "Dark Grey", hex: "#4A4A4A" },
  { id: "true-royal", label: "Royal Blue", hex: "#2563EB" },
  { id: "gold", label: "Gold", hex: "#D4A840" },
  { id: "army", label: "Army", hex: "#5C6B3C" },
  { id: "orange", label: "Orange", hex: "#E8630A" },
  { id: "athletic-heather", label: "Heather", hex: "#B0B0B0" },
  { id: "soft-cream", label: "Cream", hex: "#F5F0E1" },
  { id: "light-blue", label: "Light Blue", hex: "#93C5FD" },
  { id: "pink", label: "Pink", hex: "#F9A8D4" },
  { id: "kelly", label: "Kelly Green", hex: "#16A34A" },
  { id: "silver", label: "Silver", hex: "#C0C0C0" },
  { id: "brown", label: "Brown", hex: "#6B4423" },
  { id: "heather-navy", label: "Heather Navy", hex: "#3B5178" },
] as const;

interface ColorSwatchPickerProps {
  selected: string[];
  onChange: (colors: string[]) => void;
}

export function ColorSwatchPicker({ selected, onChange }: ColorSwatchPickerProps) {
  function toggle(colorId: string) {
    if (selected.includes(colorId)) {
      onChange(selected.filter((c) => c !== colorId));
    } else {
      onChange([...selected, colorId]);
    }
  }

  function selectDark() {
    onChange(["black", "dark-grey", "navy", "maroon", "forest"]);
  }

  function selectLight() {
    onChange(["white", "soft-cream", "light-blue", "pink", "silver"]);
  }

  function selectAll() {
    onChange(SHIRT_COLORS.map((c) => c.id));
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={selectDark}
          className="text-xs px-2.5 py-1 rounded bg-[#1C1C1C] text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors border border-[#262626]"
        >
          Dark Colors
        </button>
        <button
          type="button"
          onClick={selectLight}
          className="text-xs px-2.5 py-1 rounded bg-[#1C1C1C] text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors border border-[#262626]"
        >
          Light Colors
        </button>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs px-2.5 py-1 rounded bg-[#1C1C1C] text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors border border-[#262626]"
        >
          All
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs px-2.5 py-1 rounded bg-[#1C1C1C] text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors border border-[#262626]"
        >
          Clear
        </button>
        <span className="text-xs text-[#525252] ml-auto">{selected.length} selected</span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2">
        {SHIRT_COLORS.map((color) => {
          const isSelected = selected.includes(color.id);
          const isLight = ["white", "soft-cream", "silver", "light-blue", "pink", "gold", "athletic-heather"].includes(color.id);

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => toggle(color.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isSelected
                  ? "ring-2 ring-[#E8630A] bg-[#E8630A]/10"
                  : "hover:bg-[#1C1C1C]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  isSelected ? "border-[#E8630A] scale-110" : "border-[#333]"
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <div className="flex items-center justify-center h-full">
                    <svg className={`w-4 h-4 ${isLight ? "text-black" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <span className={`text-[10px] leading-tight text-center ${isSelected ? "text-white" : "text-[#737373]"}`}>
                {color.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SHIRT_COLORS };
