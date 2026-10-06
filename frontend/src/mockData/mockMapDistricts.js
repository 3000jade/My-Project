export const PHILIPPINE_BASEMAPS = {
  'osm-standard': {
    id: 'osm-standard',
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  'esri-satellite': {
    id: 'esri-satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    maxZoom: 18
  },
  'carto-light': {
    id: 'carto-light',
    label: 'Architectural Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20
  }
};

export const MOCK_PH_DISTRICTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'bgc',
        name: 'Bonifacio Global City',
        city: 'Taguig',
        region: 'NCR',
        highlightColor: '#174849',
        propertyCount: 14
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0400, 14.5420],
            [121.0580, 14.5420],
            [121.0580, 14.5580],
            [121.0400, 14.5580],
            [121.0400, 14.5420]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'makati-cbd',
        name: 'Makati Central Business District',
        city: 'Makati',
        region: 'NCR',
        highlightColor: '#E76F51',
        propertyCount: 19
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0150, 14.5500],
            [121.0320, 14.5500],
            [121.0320, 14.5650],
            [121.0150, 14.5650],
            [121.0150, 14.5500]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'alabang',
        name: 'Ayala Alabang & Filinvest',
        city: 'Muntinlupa',
        region: 'NCR',
        highlightColor: '#0D4446',
        propertyCount: 8
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0180, 14.4150],
            [121.0420, 14.4150],
            [121.0420, 14.4350],
            [121.0180, 14.4350],
            [121.0180, 14.4150]
          ]
        ]
      }
    }
  ]
};
