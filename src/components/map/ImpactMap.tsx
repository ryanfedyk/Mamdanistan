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

/** Build a pixel-flag divIcon for a given win category. */
function flagIcon(pin: MapPin, active: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[pin.category];
  const glyph = CATEGORY_GLYPHS[pin.category];
  return L.divIcon({
    className: "mamdani-pin",
    html: `
      <div style="
        position: relative;
        transform: translate(-50%, -100%) ${active ? "scale(1.15)" : "scale(1)"};
        transition: transform 120ms ease-out;
      ">
        <div style="
          width: 30px; height: 30px;
          display: grid; place-items: center;
          background: ${color};
          border: 2px solid #0B0E1A;
          border-radius: 4px;
          box-shadow: ${active ? `0 0 16px ${color}` : "2px 2px 0 rgba(0,0,0,0.6)"};
          font-size: 15px; line-height: 1;
        ">${glyph}</div>
        <div style="
          width: 0; height: 0; margin: -1px auto 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #0B0E1A;
        "></div>
      </div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
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
      <div className="panel crt h-[420px] overflow-hidden p-0 sm:h-[520px]">
        <MapContainer
          center={NYC_CENTER}
          zoom={NYC_ZOOM}
          scrollWheelZoom
          preferCanvas
          className="h-full w-full"
          style={{ background: "#0B0E1A" }}
        >
          {/* Dark, modern vector-ish basemap. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
          <p className="font-body text-lg text-mamdani-fog">
            Tap a flag on The Grid to read the receipts.
          </p>
        )}
      </div>
    </div>
  );
}

/** Compact selectable list so the map is keyboard-navigable too. */
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
            className={`flex items-center gap-1.5 rounded-sm border-2 px-2 py-1 font-pixel text-[8px] uppercase transition-colors ${
              active
                ? "border-black text-mamdani-ink"
                : "border-mamdani-steel text-mamdani-fog hover:text-white"
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
