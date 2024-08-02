import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import './styles.css';
import CinematicPreview from './CinematicPreview';

const OPENCAGE_API_KEY = 'apikey';

const SearchField = ({ setAddressInfo, setSelectedPosition }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const map = useMap();

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${OPENCAGE_API_KEY}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.results);
    };

    fetchSuggestions();
  }, [query]);

  const calculateZoomLevel = (currentPos, targetPos) => {
    const distance = map.distance(currentPos, targetPos);
    if (distance < 2000) return 15;
    if (distance < 5000) return 14;
    if (distance < 10000) return 13;
    return 12;
  };

  const handleSelect = (suggestion) => {
    const { lat, lng } = suggestion.geometry;
    setSelectedPosition([lat, lng]);
    setAddressInfo(suggestion.formatted);
    setQuery('');
    setSuggestions([]);
    const currentPos = map.getCenter();
    const targetPos = L.latLng(lat, lng);
    const zoomLevel = calculateZoomLevel(currentPos, targetPos);
    map.flyTo(targetPos, zoomLevel, { animate: true, duration: 2 });
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        className="search-bar"
        placeholder="Search for a location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((suggestion, index) => (
            <li key={index} onClick={() => handleSelect(suggestion)}>
              {suggestion.formatted}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const NavigationInput = ({ setStartPosition, setIsStartValid }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setIsStartValid(false);
      return;
    }

    const fetchSuggestions = async () => {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${OPENCAGE_API_KEY}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.results);
    };

    fetchSuggestions();
  }, [query]);

  const handleSelect = (suggestion) => {
    const { lat, lng } = suggestion.geometry;
    setStartPosition([lat, lng]);
    setIsStartValid(true);
    setQuery(suggestion.formatted);
    setSuggestions([]);
  };

  return (
    <div className="navigation-input-container">
      <input
        type="text"
        className="navigation-input"
        placeholder="Enter starting address..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((suggestion, index) => (
            <li key={index} onClick={() => handleSelect(suggestion)}>
              {suggestion.formatted}
            </li>
          ))}
        </ul>
      )}
      <div className="navigation-buttons">
        <button className="start-button" disabled={!query}>GO</button>
        <button className="preview-button" disabled={!query} onClick={() => setIsStartValid('preview')}>Preview</button>
      </div>
    </div>
  );
};

const MapComponent = () => {
  const [position, setPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [addressInfo, setAddressInfo] = useState('');
  const [startPosition, setStartPosition] = useState(null);
  const [isStartValid, setIsStartValid] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const mapRef = useRef();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        (err) => {
          console.error(err);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    if (position && mapRef.current) {
      mapRef.current.setView(position, 13);
    }
  }, [position]);

  return (
    <div className="map-container">
      {isPreview ? (
        <CinematicPreview start={startPosition} end={selectedPosition} onExitPreview={() => setIsPreview(false)} />
      ) : (
        <>
          <MapContainer
            center={position || [51.505, -0.09]}
            zoom={13}
            style={{ height: '100vh', width: '100%' }}
            whenCreated={(map) => { mapRef.current = map; }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && (
              <Marker position={position}>
                <Popup>
                  You are here.
                </Popup>
              </Marker>
            )}
            {selectedPosition && (
              <Marker position={selectedPosition} icon={L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', iconSize: [32, 32] })}>
                <Popup>
                  {addressInfo}
                </Popup>
              </Marker>
            )}
            <SearchField setAddressInfo={setAddressInfo} setSelectedPosition={setSelectedPosition} />
          </MapContainer>
          {addressInfo && (
            <div className="address-info">
              <h2>Address Information</h2>
              <p>{addressInfo}</p>
            </div>
          )}
          {selectedPosition && (
            <NavigationInput setStartPosition={setStartPosition} setIsStartValid={(valid) => {
              setIsStartValid(valid);
              if (valid === 'preview') setIsPreview(true);
            }} />
          )}
        </>
      )}
    </div>
  );
};

export default MapComponent;
