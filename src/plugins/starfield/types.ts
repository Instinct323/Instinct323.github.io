/**
 * Runtime configuration for the starfield canvas effect.
 *
 * **Connection-gating interaction** — three fields jointly decide when a
 * star-star line is drawn:
 *   - `mouseRadius` — when the pointer is within this distance of a star,
 *     ALL nearby stars connect (override of `percentStarsConnecting`).
 *   - `connectionsWhenNoMouse` — when true, stars may also connect with the
 *     pointer idle; when false, lines only appear while the pointer is near.
 *   - `percentStarsConnecting` — the per-star probability of being a
 *     "connector" when `connectionsWhenNoMouse` is true (or always, when
 *     set to 100).
 */
export interface StarfieldEffectConfig {
  /** Master switch — when false, the runtime never boots and the canvas stays blank. */
  enabled: boolean;
  /** Coarse star count bucket; mapped via `starDensities` to stars-per-pixel². */
  starDensity: 'low' | 'medium' | 'high' | 'ultra';
  /** Inclusive size range (CSS px) sampled uniformly per star. */
  starSize: {
    min: number;
    max: number;
  };
  /** Maximum per-axis drift speed in px/frame; sampled uniformly in `[-speedFactor/2, +speedFactor/2]`. */
  speedFactor: number;
  /** Connection reach in px; also used as the cell size for the spatial hash. */
  maxDistance: number;
  /** Any CSS color string (`#rrggbb`, `rgb(...)`, named) used to fill stars and lines. */
  starColor: string;
  /** Star fill alpha in `[0, 1]`. */
  starOpacity: number;
  /** Maximum line alpha at zero distance; falls off linearly with distance. */
  linkOpacity: number;
  /** Pool of shapes the renderer samples from per star. */
  starShapes: ('circle' | 'star')[];
  /** When true, pointer position displaces stars based on depth and `parallaxStrength`. */
  parallaxEffect: boolean;
  /** Divisor for pointer→center offset; larger = subtler parallax. */
  parallaxStrength: number;
  /** Pointer interaction radius in px — see the connection-gating note above. */
  mouseRadius: number;
  /** Inclusive rotation-speed range (rad/frame) sampled uniformly for star-shaped stars. */
  rotationSpeed: {
    min: number;
    max: number;
  };
  /** When true, star-star connections may render with the pointer idle — see connection-gating note. */
  connectionsWhenNoMouse: boolean;
  /** Per-star probability (0-100) of being eligible to draw lines when allowed — see connection-gating note. */
  percentStarsConnecting: number;
  /** Stroke width in px for connection lines. */
  lineThickness: number;
}

