"use client";

import { useState } from "react";
import { Img } from "@/components/ui";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const gallery = images.length ? images : [""];

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      <div className="hide-scrollbar flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
        {gallery.map((src, i) => (
          <button
            key={src + i}
            onClick={() => setActive(i)}
            className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border transition lg:h-24 lg:w-20 ${
              active === i ? "border-clay ring-1 ring-clay/40" : "border-transparent opacity-70 hover:opacity-100"
            }`}
            aria-label={`View image ${i + 1} of ${gallery.length}`}
          >
            <Img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div
        className="relative flex-1 overflow-hidden rounded-2xl bg-sand"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
      >
        <Img
          key={gallery[active]}
          src={gallery[active]}
          alt={name}
          priority
          className="animate-fade-in aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out"
          style={{ transformOrigin: origin, transform: zoom ? "scale(1.5)" : "scale(1)" }}
        />
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-cream/90 px-3 py-1 text-[11px] tracking-wide text-ink-soft">
          {active + 1} / {gallery.length}
        </div>
      </div>
    </div>
  );
}
