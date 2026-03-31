import { CFP_CATEGORIES } from "@/lib/types";

const DEADLINE_FILTERS = [
  { value: "", label: "All time" },
  { value: "upcoming", label: "Upcoming" },
  { value: "this_month", label: "This month" },
  { value: "next_3_months", label: "Next 3 months" },
];

interface FilterState {
  category: string;
  deadline: string;
  isVirtual: string; // "" | "true" | "false"
  search: string;
}

interface CFPFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export default function CFPFilter({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: CFPFilterProps) {
  const setFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onFiltersChange({ category: "", deadline: "", isVirtual: "", search: "" });
  };

  const hasFilters =
    filters.category || filters.deadline || filters.isVirtual || filters.search;

  return (
    <div>
      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: 24 }}>
        <span className="search-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search by title, conference, or tags…"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
        />
        {filters.search && (
          <button
            onClick={() => setFilter("search", "")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", fontSize: 13 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="filter-bar">
        <span className="filter-label">Category</span>
        <button
          className={`filter-chip ${filters.category === "" ? "active" : ""}`}
          onClick={() => setFilter("category", "")}
        >
          All
        </button>
        {CFP_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filters.category === cat ? "active" : ""}`}
            onClick={() => setFilter("category", filters.category === cat ? "" : cat)}
          >
            {cat}
          </button>
        ))}

        <div className="filter-divider" />
        <span className="filter-label">Deadline</span>
        {DEADLINE_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-chip ${filters.deadline === f.value ? "active" : ""}`}
            onClick={() => setFilter("deadline", f.value)}
          >
            {f.label}
          </button>
        ))}

        <div className="filter-divider" />
        <span className="filter-label">Format</span>
        <button
          className={`filter-chip ${filters.isVirtual === "" ? "active" : ""}`}
          onClick={() => setFilter("isVirtual", "")}
        >
          Any
        </button>
        <button
          className={`filter-chip ${filters.isVirtual === "true" ? "active" : ""}`}
          onClick={() => setFilter("isVirtual", filters.isVirtual === "true" ? "" : "true")}
        >
          🌐 Virtual
        </button>
        <button
          className={`filter-chip ${filters.isVirtual === "false" ? "active" : ""}`}
          onClick={() => setFilter("isVirtual", filters.isVirtual === "false" ? "" : "false")}
        >
          📍 In-person
        </button>

        {hasFilters && (
          <>
            <div className="filter-divider" />
            <button
              className="filter-chip"
              onClick={clearAll}
              style={{ color: "var(--red)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              ✕ Clear all
            </button>
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="stats-bar">
        <p className="stats-count">
          Showing <strong>{filteredCount}</strong> of{" "}
          <strong>{totalCount}</strong> CFPs
        </p>
      </div>
    </div>
  );
}
