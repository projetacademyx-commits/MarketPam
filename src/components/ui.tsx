/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

export function Img({
  src,
  alt,
  className,
  style,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="shrink-0"
          >
            <defs>
              <linearGradient id={`half-${i}-${size}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.47 5.1 5.53.77-4.02 3.86.97 5.5L10 14.2l-4.95 2.63.97-5.5L2 7.47l5.53-.77L10 1.6z"
              fill={fill === 1 ? "currentColor" : fill === 0.5 ? `url(#half-${i}-${size})` : "none"}
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
              className="text-clay"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function Pill({ children, tone = "sand" }: { children: React.ReactNode; tone?: "sand" | "clay" | "ink" }) {
  const tones = {
    sand: "bg-sand text-ink-soft",
    clay: "bg-clay text-white",
    ink: "bg-ink text-cream",
  };
  return (
    <span className={`text-eyebrow inline-flex items-center rounded-full px-3 py-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}
