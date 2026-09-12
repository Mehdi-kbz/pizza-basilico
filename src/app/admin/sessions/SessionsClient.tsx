"use client";

import { useEffect, useState, useCallback } from "react";

interface Location {
  id: string;
  label: string;
  address: string;
  isFavorite: boolean;
}
interface SessionView {
  id: string;
  startAt: string;
  endAt: string;
  isOrderingOpen: boolean;
  unitsCapPerWindow: number;
  ordersCapPerWindow: number;
  windowMinutes: number;
  location: Location;
}

const DEFAULTS_KEY = "pizza-basilico-session-defaults";

function loadDefaults() {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (raw) return JSON.parse(raw) as { windowMinutes: number; unitsCapPerWindow: number; ordersCapPerWindow: number };
  } catch {
    /* stockage indisponible — on retombe sur les valeurs par défaut */
  }
  return { windowMinutes: 10, unitsCapPerWindow: 6, ordersCapPerWindow: 4 };
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionsClient() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sessions, setSessions] = useState<SessionView[]>([]);
  const defaults = loadDefaults();

  const [locationId, setLocationId] = useState<string>("");
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [startAt, setStartAt] = useState(toLocalInputValue(new Date(Date.now() + 30 * 60000)));
  const [endAt, setEndAt] = useState(toLocalInputValue(new Date(Date.now() + 3.5 * 60 * 60000)));
  const [windowMinutes, setWindowMinutes] = useState(defaults.windowMinutes);
  const [unitsCap, setUnitsCap] = useState(defaults.unitsCapPerWindow);
  const [ordersCap, setOrdersCap] = useState(defaults.ordersCapPerWindow);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sessions");
    if (res.ok) {
      const data = await res.json();
      setLocations(data.locations);
      setSessions(data.sessions);
      if (!locationId && data.locations[0]) setLocationId(data.locations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        windowMinutes,
        unitsCapPerWindow: unitsCap,
        ordersCapPerWindow: ordersCap,
      };
      if (locationId === "__new__") {
        if (!newLabel || !newAddress) return setError("Nom et adresse du nouvel emplacement requis.");
        payload.newLocation = { label: newLabel, address: newAddress };
      } else {
        payload.locationId = locationId;
      }

      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Erreur lors de la création.");

      try {
        localStorage.setItem(
          DEFAULTS_KEY,
          JSON.stringify({ windowMinutes, unitsCapPerWindow: unitsCap, ordersCapPerWindow: ordersCap })
        );
      } catch {
        /* pas grave si le stockage local est indisponible */
      }
      setNewLabel("");
      setNewAddress("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleOrdering(id: string, isOrderingOpen: boolean) {
    await fetch(`/api/admin/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOrderingOpen }),
    });
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-char p-5 flex flex-col gap-3">
        <h2 className="font-semibold">Nouvelle session</h2>

        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="field"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
          <option value="__new__">+ Nouvel emplacement…</option>
        </select>

        {locationId === "__new__" && (
          <div className="grid gap-2">
            <input
              className="field"
              placeholder="Nom (ex. Place de la Mairie)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <input
              className="field"
              placeholder="Adresse complète"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-cream-dim">
            Début
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="field w-full mt-1"
            />
          </label>
          <label className="text-xs text-cream-dim">
            Fin
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="field w-full mt-1"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-cream-dim">
            Fenêtre (min)
            <input
              type="number"
              min={1}
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(Number(e.target.value))}
              className="field w-full mt-1"
            />
          </label>
          <label className="text-xs text-cream-dim">
            Pizzas / fenêtre
            <input
              type="number"
              min={1}
              value={unitsCap}
              onChange={(e) => setUnitsCap(Number(e.target.value))}
              className="field w-full mt-1"
            />
          </label>
          <label className="text-xs text-cream-dim">
            Commandes / fenêtre
            <input
              type="number"
              min={1}
              value={ordersCap}
              onChange={(e) => setOrdersCap(Number(e.target.value))}
              className="field w-full mt-1"
            />
          </label>
        </div>

        {error && <p className="text-tomato text-sm">{error}</p>}

        <button disabled={submitting} className="btn btn-primary">
          {submitting ? "…" : "Publier la session"}
        </button>
      </form>

      <section>
        <h2 className="font-semibold mb-3">Sessions à venir / en cours</h2>
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between border border-line rounded p-3 bg-char text-sm">
              <div>
                <p className="font-medium">{s.location.label}</p>
                <p className="text-cream-dim">
                  {new Date(s.startAt).toLocaleString("fr-FR")} – {new Date(s.endAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {s.unitsCapPerWindow} pizzas / {s.windowMinutes} min
                </p>
              </div>
              <button
                onClick={() => toggleOrdering(s.id, !s.isOrderingOpen)}
                className={`text-xs rounded px-2.5 py-1.5 border ${
                  s.isOrderingOpen ? "border-line" : "border-tomato bg-tomato text-cream"
                }`}
              >
                {s.isOrderingOpen ? "Fermer les commandes" : "Rouvrir les commandes"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
