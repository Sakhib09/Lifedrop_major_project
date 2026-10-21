import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const userLocationIcon = L.divIcon({
  className: "lifedrop-user-marker",
  html: '<div class="lifedrop-user-marker-dot"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function MapCenter({ position }) {
  const map = useMap();

  if (position) {
    map.setView(position, 14);
  }

  return null;
}

export default function DonorMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [message, setMessage] = useState("");
  const [places, setPlaces] = useState([]);
const [placesLoading, setPlacesLoading] = useState(false);
const [placesError, setPlacesError] = useState("");
const [radiusKm, setRadiusKm] = useState(10);
const activeCategories = ["hospitals", "camps"];
const findNearbyPlaces = async (
  latitude,
  longitude,
  selectedRadius = radiusKm
) => {
  setPlacesLoading(true);
  setPlacesError("");

  const radiusMeters = selectedRadius * 1000;

  const query = `
    [out:json][timeout:20];
    (
      nwr["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="doctors"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="blood_donation"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="blood_donation"](around:${radiusMeters},${latitude},${longitude});    
      );
    out center tags;
  `;

  const servers = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let resultData = null;
  let lastError = null;

  for (const server of servers) {
    try {
      const response = await fetch(server, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ data: query }),
      });

      if (!response.ok) {
        throw new Error(`Map service returned HTTP ${response.status}`);
      }

      resultData = await response.json();
      break;
    } catch (error) {
      lastError = error;
    }
  }

  try {
    if (!resultData) {
      throw new Error(
        lastError?.message ||
          "Healthcare data is temporarily unavailable. Please try again."
      );
    }

    const results = (resultData.elements || [])
      .map((place) => {
        const lat = place.lat ?? place.center?.lat;
        const lon = place.lon ?? place.center?.lon;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return null;
        }

        const tags = place.tags || {};

        return {
          id: `${place.type}-${place.id}`,
          name: tags.name || "Unnamed healthcare facility",
          type:
            tags.amenity ||
            tags.healthcare ||
            "Healthcare facility",
          latitude: lat,
          longitude: lon,
          phone:
            tags.phone ||
            tags["contact:phone"] ||
            tags["contact:mobile"] ||
            null,
          address: [
            tags["addr:housenumber"],
            tags["addr:street"],
            tags["addr:city"],
          ]
            .filter(Boolean)
            .join(", "),
          source: "OpenStreetMap",
        };
      })
      .filter(Boolean);

    setPlaces(results);

    if (results.length === 0) {
      setPlacesError(
        `No mapped healthcare facilities were found within ${selectedRadius} km. Try a larger radius.`
      );
    }
  } catch (error) {
    setPlaces([]);
    setPlacesError(
      error.message || "Unable to load healthcare facilities."
    );
  } finally {
    setPlacesLoading(false);
  }
};
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support GPS.");
      return;
    }

    setMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
   const latitude = position.coords.latitude;
const longitude = position.coords.longitude;

setUserLocation([latitude, longitude]);
setMessage("Your location was detected successfully.");

findNearbyPlaces(latitude, longitude);
      },
      (error) => {
        setMessage(
          error.code === 1
            ? "Location permission denied. Allow location access."
            : "Unable to detect your location. Please try again."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const mapCenter = userLocation || [12.9716, 77.5946];

  return (
    <section className="donor-map-section">
      <div className="donor-map-heading">
        <div>
          <span className="donor-map-eyebrow">
            LIFEDROP LOCATION SERVICES
          </span>

          <h2>Explore Nearby</h2>

          <p>
            Find blood donation resources around your location.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={getCurrentLocation}
        >
          📍 Use My Location
        </button>
      </div>

<div className="donor-map-radius">
  <label htmlFor="radius-select">
    Search radius
  </label>

  <select
    id="radius-select"
    value={radiusKm}
   onChange={(event) => {
  const newRadius = Number(event.target.value);
  setRadiusKm(newRadius);

  if (userLocation) {
    findNearbyPlaces(
      userLocation[0],
      userLocation[1],
      newRadius
    );
  }
}}
  >
    <option value={5}>Within 5 km</option>
    <option value={10}>Within 10 km</option>
    <option value={25}>Within 25 km</option>
  </select>
</div>
      {message && (
        <p className="donor-map-message" role="status">
          {message}
        </p>
      )}
      {placesLoading && (
  <p className="donor-map-message" role="status">
    Searching OpenStreetMap for nearby healthcare facilities...
  </p>
)}

{placesError && (
  <div className="donor-map-error" role="status">
    <p>{placesError}</p>

    {userLocation && (
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          findNearbyPlaces(
            userLocation[0],
            userLocation[1]
          )
        }
        disabled={placesLoading}
      >
        {placesLoading ? "Searching..." : "Try again"}
      </button>
    )}
  </div>
)}{placesError && (
  <div className="donor-map-error" role="status">
    <p>{placesError}</p>

    {userLocation && (
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          findNearbyPlaces(
            userLocation[0],
            userLocation[1]
          )
        }
        disabled={placesLoading}
      >
        {placesLoading ? "Searching..." : "Try again"}
      </button>
    )}
  </div>
)}
{!placesLoading && places.length > 0 && (
  <p className="donor-map-message" role="status">
    Found {places.length} mapped healthcare facilities.
  </p>
)}

      <div className="donor-map-container">
        <MapContainer
          center={mapCenter}
          zoom={11}
          scrollWheelZoom={true}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <>
              <MapCenter position={userLocation} />

             <Marker
  position={userLocation}
  icon={userLocationIcon}
  zIndexOffset={1000}
>
  <Popup>
    <strong>You are here</strong>
    <br />
    Your current GPS location
  </Popup>
</Marker>
            </>
          )}
          {places
  .filter((place) => {
    if (
      activeCategories.includes("hospitals") &&
      ["hospital", "clinic", "doctors"].includes(place.type)
    ) {
      return true;
    }

    if (
      activeCategories.includes("camps") &&
      ["blood_donation"].includes(place.type)
    ) {
      return true;
    }

    return false;
  })
  .map((place) => (
    <Marker
      key={place.id}
      position={[place.latitude, place.longitude]}
    >
      <Popup>
        <strong>{place.name}</strong>
        <br />
        Type: {place.type}

        {place.address && (
          <>
            <br />
            Address: {place.address}
          </>
        )}

        <br />
        <strong>Phone:</strong>{" "}
        {place.phone ? (
          <a href={`tel:${place.phone}`}>{place.phone}</a>
        ) : (
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `${place.name} ${place.address} official phone number`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Find contact details
          </a>
        )}

        <br />
        Source: {place.source}
      </Popup>
    </Marker>
  ))}
        </MapContainer>
      </div>

      <p className="donor-map-note">
        Map filters are ready for integration. Actual donor, hospital,
        and camp markers will appear after connecting their location data.
      </p>
    </section>
  );
}