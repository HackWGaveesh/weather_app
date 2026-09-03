import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudMoon,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { GlyphName } from "@/lib/wmo";

const GLYPHS: Record<GlyphName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  "cloud-moon": CloudMoon,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  freezing: Snowflake,
  snow: CloudSnow,
  showers: CloudRain,
  thunder: CloudLightning,
  hail: CloudHail,
};

export function WeatherIcon({
  glyph,
  className,
  strokeWidth = 1.25,
}: {
  glyph: GlyphName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = GLYPHS[glyph] ?? Cloud;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
