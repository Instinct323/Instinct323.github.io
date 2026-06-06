export interface StarfieldEffectConfig {
  enabled: boolean;
  starDensity: 'low' | 'medium' | 'high' | 'ultra';
  starSize: {
    min: number;
    max: number;
  };
  speedFactor: number;
  maxDistance: number;
  starColor: string;
  starOpacity: number;
  linkOpacity: number;
  starShapes: ('circle' | 'star')[];
  parallaxEffect: boolean;
  parallaxStrength: number;
  mouseRadius: number;
  rotationSpeed: {
    min: number;
    max: number;
  };
  connectionsWhenNoMouse: boolean;
  percentStarsConnecting: number;
  lineThickness: number;
}

export interface SiteEffectsConfig {
  starfield: StarfieldEffectConfig;
}
