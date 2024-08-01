import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const ROUTING_API_KEY = '5b3ce3597851110001cf624819a7ec8b10074945b21db45739312c54';
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZmF0aGVlbjAiLCJhIjoiY2x6YWVoMnZ4MGlydzJrcG5hbGRmamR2diJ9.tc5lOCuofoVHaDJlV5R6ZQ';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const CinematicPreview = ({ start, end, onExitPreview }) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: start,
      zoom: 14,
      pitch: 40, 
      bearing: 0,
      antialias: true,
    });

    const getRoute = async () => {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ROUTING_API_KEY}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`
      );
      const data = await response.json();
      const coordinates = data.features[0].geometry.coordinates;

      map.on('load', () => {
       
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
          },
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#888',
            'line-width': 8,
          },
        });


        let i = 0;
        const interval = setInterval(() => {
          if (i < coordinates.length) {
            map.flyTo({
              center: coordinates[i],
              zoom: 25,
              speed: 3, 
              curve: 1, 
              easing(t) {
                return t;
              },
              essential: true, 
            });
            i++;
          } else {
            clearInterval(interval);
          }
        }, 2000);

        return () => {
          clearInterval(interval);
        };
      });
    };

    getRoute();

    return () => {
      map.remove();
    };
  }, [start, end]);

  return (
    <div className="cinematic-preview">
      <div ref={mapContainerRef} style={{ height: '100vh', width: '100%' }}></div>
      <button className="exit-button" onClick={onExitPreview}>❌</button>
    </div>
  );
};

export default CinematicPreview;
