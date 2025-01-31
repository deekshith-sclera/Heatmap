
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import floorplan from "./assets/office.png";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-semicircle";
 
// Import the CCTV and WiFi icons
import bulletCamIconUrl from "./assets/cctvs/bulletcam.jpg";
import unvCamIconUrl from "./assets/cctvs/Unvcam.jpg";
 

const bulletCameraIcon = new L.Icon({
  iconUrl: bulletCamIconUrl,
  iconSize: [35, 35],
});
 
const unvCameraIcon = new L.Icon({
  iconUrl: unvCamIconUrl,
  iconSize: [25, 25],
});
 
function SemiCircleComponent({
  position,
  radius,
  startAngle,
  stopAngle,
  rotationAngle = 0,
  fillOpacity = 0.3,
}) {
  const map = useMap();
 
  useEffect(() => {
    if (!map) return;
 
    // Create the semicircle with dynamic rotation
    const semiCircle = L.semiCircle(position, {
      radius,
      // Dynamically adjust start and stop angles
      startAngle: startAngle + rotationAngle,
      stopAngle: stopAngle + rotationAngle,
      color: "blue",
      fillColor: "rgba(0, 0, 255, 0.3)",
      fillOpacity: fillOpacity,
      weight: 1,
    });
 
    semiCircle.addTo(map);
 
    // Cleanup on unmount
    return () => {
      map.removeLayer(semiCircle);
    };
  }, [
    map,
    position,
    radius,
    startAngle,
    stopAngle,
    rotationAngle,
    fillOpacity,
  ]);
 
  return null;
}

function Cctv() {

  const imageWidth = 1920;
  const imageHeight = 1080;
 
  // Predefined camera models with enhanced details
  const cameraModels = [
    {
      name: "Bullet Camera",
      startFov: 0,
      maxFoV: 70,
      maxDistance: 380,
      icon: bulletCameraIcon,
      color: "rgba(0, 0, 255, 0.3)", // Blue with transparency
    },
    {
      name: "UNV Camera",
      startFov: 0,
      maxFoV: 90,
      maxDistance: 320,
      icon: unvCameraIcon,
      color: "rgba(255, 0, 0, 0.3)", // Red with transparency
    },
  ];
 
  // Initial state 
  const [cctvPoints, setCCTVPoints] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  console.log(cctvPoints);
  const bounds = [
    [0, 0],
    [imageHeight, imageWidth],
  ];
 
  const addCCTVPoint = () => {
    if (selectedModel) {
      setCCTVPoints((prevPoints) => [
        ...prevPoints,
        {
          position: [imageHeight / 2, imageWidth / 2],
          model: selectedModel,
          rotationAngle: 0, //fov rotation angle
          fillOpacity: 0.3, //opacity
        },
      ]);
    } else {
      alert("Please select a camera model first!");
    }
  };
 
  const handleMarkerDragEnd = (event, index) => {
    let { lat, lng } = event.target.getLatLng();
 
    // fix the coordinates to bounds of the image
    lat = Math.min(Math.max(lat, 0), imageHeight);
    lng = Math.min(Math.max(lng, 0), imageWidth);
 
    setCCTVPoints((prevPoints) => {
      const newPoints = [...prevPoints];
      newPoints[index].position = [lat, lng];
      return newPoints;
    });
  };
 
  const updateCameraSettings = (index, updates) => {
    setCCTVPoints((prevPoints) => {
      const newPoints = [...prevPoints];
      newPoints[index] = { ...newPoints[index], ...updates };
      return newPoints;
    });
  };
 
  const deleteMarker = (index) => {
    setCCTVPoints((prevPoints) => prevPoints.filter((_, i) => i !== index));
  };

  console.log(cctvPoints)

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
      {/* sidebar and dropdown for different camera models and their specifications */}
      <div
        style={{
          width: "300px",
          padding: "10px",
          backgroundColor: "#303030",
          color: "white",
          overflowY: "auto",
        }}
      >
        <h3>Camera Configuration</h3>
 
        {/* selecting the camera model */}
        <div style={{ marginBottom: "15px" }}>
          <label>Select Camera Model:</label>
          <select
            value={selectedModel ? selectedModel.name : ""}
            onChange={(e) => {
              const model = cameraModels.find((m) => m.name === e.target.value);
              setSelectedModel(model);
            }}
            style={{ width: "100%", padding: "5px", marginTop: "5px" }}
          >
            <option value="" disabled>
              Choose Camera Type
            </option>
            {cameraModels.map((model, index) => (
              <option key={index} value={model.name}>
                {model.name} (FoV: {model.maxFoV}°, Range: {model.maxDistance}m)
              </option>
            ))}
          </select>
        </div>
 
        {/* Add Camera Point Button */}
        <button
          onClick={addCCTVPoint}
          disabled={!selectedModel}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: selectedModel ? "blue" : "gray",
            color: "white",
            border: "none",
            borderRadius: "5px",
            marginBottom: "15px",
          }}
        >
          Add Camera Point
        </button>
      </div>
 
      {/* Map Container- contains floormap using react leaflet */}
      <MapContainer
        zoom={-1}
        center={[imageHeight / 2, imageWidth / 2]}
        minZoom={-2}
        bounds={bounds}
        style={{ height: "100%", width: "100%" }}
        crs={L.CRS.Simple}
      >
        <ImageOverlay zIndex={1} url={floorplan} bounds={bounds} />
 
        {cctvPoints.map(
          (
            { position, model, rotationAngle = 0, fillOpacity = 0.3 },
            index
          ) => (
            <Marker
              key={index}
              position={position}
              icon={model.icon}
              draggable={true}
              eventHandlers={{
                dragend: (event) => handleMarkerDragEnd(event, index),
              }}
            >
              <Popup>
                <div style={{ minWidth: "250px" }}>
                  <h4>{model.name} Details</h4>
 
                  {/* Rotation Control to camera angles */}
                  <div style={{ marginBottom: "10px" }}>
                    
                    <label>Swipe to Rotate</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={rotationAngle}
                      onChange={(e) =>
                        updateCameraSettings(index, {
                          rotationAngle: Number(e.target.value),
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>

                {/* Delete camera button */}
                  <button
                    onClick={() => deleteMarker(index)}
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      padding: "5px 10px",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    Delete Camera
                  </button>
                </div>
              </Popup>
 
              <SemiCircleComponent
                position={position}
                radius={model.maxDistance}
                startAngle={0}
                stopAngle={model.maxFoV}
                rotationAngle={rotationAngle}
                 fillOpacity={fillOpacity}
               
              />
            </Marker>
          )
        )}
      </MapContainer>
    </div>
  )
}

export default Cctv

