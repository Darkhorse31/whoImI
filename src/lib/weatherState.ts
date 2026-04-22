/* ═══════════════════════════════════════════════════════════════
   Shared Weather State — mutable singleton read by animation loops
   (no React re-renders, frame-by-frame reads via refs)
   ═══════════════════════════════════════════════════════════════ */

export interface WeatherState {
  /** 0–1 lightning flash brightness (written by ThunderEffect) */
  flashIntensity: number;
  /** 0–1 overall storm intensity (derived from active effects) */
  stormIntensity: number;
  /** Wind force magnitude */
  windStrength: number;
  /** Wind angle in radians */
  windAngle: number;
  /** Whether rain is currently active */
  isRaining: boolean;
  /** Whether snow is currently active */
  isSnowing: boolean;
  /** Whether thunder is currently active */
  isThundering: boolean;
  /** Camera shake magnitude (set by thunder) */
  cameraShake: number;
  /** Rain intensity 0–1 */
  rainIntensity: number;
  /** Snow intensity 0–1 */
  snowIntensity: number;
}

export const weatherState: WeatherState = {
  flashIntensity: 0,
  stormIntensity: 0,
  windStrength: 0,
  windAngle: 0,
  isRaining: false,
  isSnowing: false,
  isThundering: false,
  cameraShake: 0,
  rainIntensity: 0,
  snowIntensity: 0,
};

/** Batch-update weather state fields */
export function updateWeather(partial: Partial<WeatherState>) {
  Object.assign(weatherState, partial);
}
