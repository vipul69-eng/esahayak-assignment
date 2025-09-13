// app/components/tag-chips.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestionsLimit?: number;
};

export default function TagChips({
  value,
  onChange,
  placeholder = "Add tag…",
  maxTags = 20,
  suggestionsLimit = 10,
}: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const listId = useMemo(
    () => `tag-options-${Math.random().toString(36).slice(2)}`,
    [],
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/tags?q=${encodeURIComponent(input)}&limit=${suggestionsLimit}`,
        );
        const json = (await res.json()) as { tags: string[] };
        setSuggestions(
          Array.from(new Set(json.tags)).slice(0, suggestionsLimit),
        );
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [input, suggestionsLimit]);

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (value.includes(t)) {
      setInput("");
      return;
    }
    if (value.length >= maxTags) return;
    onChange([...value, t]);
    setInput("");
    inputRef.current?.focus();
  };

  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border p-2">
      {value.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm"
        >
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => remove(t)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        list={listId}
        placeholder={placeholder}
        className="min-w-[140px] flex-1 outline-none"
        autoComplete="off"
        aria-haspopup="listbox"
      />

      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {loading && <span className="text-xs text-gray-500">Loading…</span>}
    </div>
  );
}
