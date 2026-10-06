export type BasemapId = 'osm-standard' | 'esri-satellite' | 'carto-light';

export interface BasemapConfig {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export interface DistrictProperties {
  id: string;
  name: string;
  city: string;
  region: string;
  highlightColor: string;
  propertyCount?: number;
}

export interface DistrictFeature {
  type: 'Feature';
  properties: DistrictProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface DistrictFeatureCollection {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}
