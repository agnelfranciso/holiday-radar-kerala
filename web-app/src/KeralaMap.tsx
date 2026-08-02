import React, { useMemo } from 'react';
import * as d3 from 'd3-geo';
import keralaGeoJson from './kerala-districts.json';

interface KeralaMapProps {
  data: any[];
  tooltipHandlers: {
    enter: (e: React.MouseEvent, color: string, prefix?: string) => void;
    move: (e: React.MouseEvent) => void;
    leave: () => void;
  };
  highlightDistrict?: string;
}

const getFillColor = (color: string) => {
  switch (color) {
    case 'green': return 'var(--alert-green-text)';
    case 'yellow': return 'var(--alert-yellow-text)';
    case 'orange': return 'var(--alert-orange-text)';
    case 'red': return 'var(--alert-red-text)';
    default: return '#e5e7eb'; // default grey
  }
};

const KeralaMap: React.FC<KeralaMapProps> = ({ data, tooltipHandlers, highlightDistrict }) => {
  // Create an SVG projection for Kerala
  const projection = useMemo(() => {
    return d3.geoMercator()
      .fitSize([300, 500], keralaGeoJson as any);
  }, []);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  return (
    <div className="map-container glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '550px', padding: '1.25rem' }}>
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Today's Alerts Map</h3>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center' }}>
        <svg width="100%" viewBox="0 0 300 500" style={{ maxHeight: '100%' }}>
          <g>
            {keralaGeoJson.features.map((feature, i) => {
            const districtName = feature.properties.DISTRICT;
            // Match the district name. API might return Kasaragode or Kasaragod
            const districtData = data.find(d => 
              d.district.toLowerCase() === districtName.toLowerCase() || 
              (d.district === 'Kasaragode' && districtName === 'Kasaragod') ||
              (d.district === 'Kasaragod' && districtName === 'Kasaragode')
            );
            
            let color = districtData ? districtData.today : 'unknown';
            
            if (highlightDistrict) {
               const matches = highlightDistrict.toLowerCase() === districtName.toLowerCase() || 
                              (highlightDistrict === 'Kasaragode' && districtName === 'Kasaragod') ||
                              (highlightDistrict === 'Kasaragod' && districtName === 'Kasaragode');
               if (!matches) {
                 color = 'unknown'; // This will make getFillColor return grey
               }
            }
            
            const fillColor = getFillColor(color);

            return (
              <path
                key={i}
                d={pathGenerator(feature as any) || ''}
                fill={fillColor}
                stroke="var(--bg-card)"
                strokeWidth={1}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  tooltipHandlers.enter(e, color, districtName);
                }}
                onMouseMove={tooltipHandlers.move}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  tooltipHandlers.leave();
                }}
              />
            );
          })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default KeralaMap;
