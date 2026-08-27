"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SelectedLocation = {
  name: string;
  lat: number;
  lon: number;
};

// Orts-Suchfeld (AC-12, EC-3): tippen → Vorschläge → Auswahl.
// Gespeichert wird nur ein aufgelöster Treffer — die hidden fields sind leer,
// solange nichts ausgewählt ist. Wiederverwendet von PROJ-2 für den
// Aktivitäts-Standort.
export function LocationSearch({
  defaultLocation,
  namePrefix = "location",
}: {
  defaultLocation: SelectedLocation | null;
  namePrefix?: string;
}) {
  const [selected, setSelected] = useState<SelectedLocation | null>(
    defaultLocation
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nur Aufräumen beim Unmount — die Suche selbst läuft im Change-Handler.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function search(q: string) {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Die Ortssuche ist gerade nicht erreichbar");
        setResults([]);
        setOpen(true);
        return;
      }
      const body: { results: SelectedLocation[] } = await res.json();
      setError(null);
      setResults(body.results);
      setOpen(true);
    } catch {
      setError("Die Ortssuche ist gerade nicht erreichbar");
      setResults([]);
      setOpen(true);
    } finally {
      setSearching(false);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      void search(q);
    }, 300);
  }

  return (
    <div className="space-y-2">
      {/* Nur ein vollständig aufgelöster Ort landet im Formular (EC-3) */}
      <input
        type="hidden"
        name={`${namePrefix}Name`}
        value={selected?.name ?? ""}
      />
      <input
        type="hidden"
        name={`${namePrefix}Lat`}
        value={selected?.lat ?? ""}
      />
      <input
        type="hidden"
        name={`${namePrefix}Lon`}
        value={selected?.lon ?? ""}
      />

      {selected ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted px-3 py-2">
          <span className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-primary" aria-hidden />
            {selected.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected(null);
              setQuery("");
            }}
            aria-label="Ort entfernen"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Ort suchen, z. B. Linz …"
            role="combobox"
            aria-expanded={open}
            aria-controls="location-search-results"
            aria-label="Ort suchen"
          />
          {searching && (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
          {open && (
            <ul
              id="location-search-results"
              role="listbox"
              className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-sm"
            >
              {error ? (
                <li className="px-3 py-2 text-sm text-destructive">{error}</li>
              ) : results.length === 0 && !searching ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Kein Ort gefunden
                </li>
              ) : (
                results.map((r) => (
                  <li key={`${r.name}-${r.lat}-${r.lon}`} role="option" aria-selected={false}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
                      onClick={() => {
                        setSelected(r);
                        setOpen(false);
                      }}
                    >
                      <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {r.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
