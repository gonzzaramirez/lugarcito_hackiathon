import L from "leaflet";

export function createUserIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: #3B82F6;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
