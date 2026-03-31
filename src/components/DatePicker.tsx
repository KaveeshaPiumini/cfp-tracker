"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

export default function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const renderDays = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const count = daysInMonth(month, year);
    const start = firstDayOfMonth(month, year);
    
    const days = [];
    // Spacers for first week
    for (let i = 0; i < start; i++) {
      days.push(<div key={`empty-${i}`} className="datepicker-day empty" />);
    }
    
    // Actual days
    for (let d = 1; d <= count; d++) {
      const isSelected = value === `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      
      days.push(
        <button
          key={d}
          type="button"
          className={`datepicker-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
          onClick={() => handleDateSelect(d)}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="datepicker-container" ref={containerRef}>
      <div 
        className={`datepicker-input-wrapper ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          className="form-input datepicker-display-input"
          value={value || "Select date..."}
          readOnly
          style={{ cursor: "pointer" }}
        />
        <div className="datepicker-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="datepicker-popover">
          <div className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={handlePrevMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="datepicker-current-month">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button type="button" className="datepicker-nav-btn" onClick={handleNextMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          
          <div className="datepicker-weekdays">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="datepicker-weekday">{d}</div>
            ))}
          </div>
          
          <div className="datepicker-grid">
            {renderDays()}
          </div>
        </div>
      )}

    </div>
  );
}
