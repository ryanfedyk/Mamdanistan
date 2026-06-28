"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPin } from "@/lib/types";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";

/**
 * THE GRID — interactive tactical map of the five boroughs.
 * Client-only (Leaflet touches `window`); load via next/dynamic with
 * `ssr: false`. Clicking a pin pulls its localized card alongside the map.
 */

// NYC, framed so all five boroughs sit on screen.
const NYC_CENTER: [number, number] = [40.7128, -74.006];
const NYC_ZOOM = 11;

/** Build a campaign flag-pin divIcon for a given win category. */
function flagIcon(pin: MapPin, active: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[pin.category];
  const glyph = CATEGORY_GLYPHS[pin.category];
  return L.divIcon({
    className: "mamdani-pin",
    html: `
      <div style="
        position: relative;
        transform: translate(-50%, -100%) ${active ? "scale(1.18)" : "scale(1)"};
        transition: transform 120ms ease-out;
      ">
        <div style="
          width: 34px; height: 34px;
          display: grid; place-items: center;
          background: ${color};
          border: 3px solid #180F78;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: ${active ? `0 0 0 4px #FFAB00` : "2px 2px 0 rgba(24,15,120,0.5)"};
        ">
          <span style="transform: rotate(45deg); font-size: 15px; line-height: 1;">${glyph}</span>
        </div>
      </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  });
}

export function ImpactMap() {
  const [activeId, setActiveId] = useState<string>(MAP_PINS[0]?.id ?? "");
  const activePin = useMemo(
    () => MAP_PINS.find((p) => p.id === activeId),
    [activeId],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* Map canvas */}
      <div className="card-poster h-[58vh] overflow-hidden p-0 sm:h-[520px]">
        <MapContainer
          center={NYC_CENTER}
          zoom={NYC_ZOOM}
          scrollWheelZoom
          preferCanvas
          className="h-full w-full"
          style={{ background: "#FBF3DE" }}
        >
          {/* Polished light vector basemap, on-brand with the cream palette. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {MAP_PINS.map((pin) => (
            <Marker
              key={pin.id}
              position={pin.coordinates}
              icon={flagIcon(pin, pin.id === activeId)}
              eventHandlers={{ click: () => setActiveId(pin.id) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Localized card view */}
      <div className="space-y-3">
        <PinList activeId={activeId} onSelect={setActiveId} />
        {activePin ? (
          <PinCard pin={activePin} />
        ) : (
          <p className="font-sans text-lg text-campaign-ink/70">
            Tap a flag on The Grid to read the receipts.
          </p>
        )}
      </div>
    </div>
  );
}

/** Compact selectable list so the map is tappable + keyboard-navigable. */
function PinList({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MAP_PINS.map((pin) => {
        const active = pin.id === activeId;
        const color = CATEGORY_COLORS[pin.category];
        return (
          <button
            key={pin.id}
            onClick={() => onSelect(pin.id)}
            className={`flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-campaign-navy px-3 py-2 font-display text-sm font-bold transition-transform hover:-translate-y-0.5 ${
              active ? "text-campaign-cream shadow-poster-sm" : "bg-campaign-cream text-campaign-navy"
            }`}
            style={active ? { backgroundColor: color } : undefined}
          >
            <span aria-hidden>{CATEGORY_GLYPHS[pin.category]}</span>
            {pin.title}
          </button>
        );
      })}
    </div>
  );
}
