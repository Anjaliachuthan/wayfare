import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Coord {
  latitude: number;
  longitude: number;
}

interface OSMRouteMapProps {
  pickup: { lat: number; lng: number; title: string };
  dropoff: { lat: number; lng: number; title: string };
  routeCoords?: Coord[];
  satellite?: boolean;
}

export default function OSMRouteMap({ pickup, dropoff, routeCoords = [], satellite = false }: OSMRouteMapProps) {
  const webViewRef = useRef<WebView>(null);

  const tileUrl = satellite
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const html = useMemo(() => {
    const latlngs = JSON.stringify(routeCoords.map((c) => [c.latitude, c.longitude]));
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          * { margin:0; padding:0; box-sizing: border-box; }
          html, body, #map { width:100%; height:100%; background: #e5e3df; }
          .leaflet-control-attribution { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${pickup.lat}, ${pickup.lng}], 13);
          L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

          var pickupIcon = L.divIcon({
            html: '<div style="background:#0F5132; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            className: ''
          });
          var dropoffIcon = L.divIcon({
            html: '<div style="background:#EF4444; width:16px; height:16px; border-radius:3px; border:3px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            className: ''
          });

          L.marker([${pickup.lat}, ${pickup.lng}], { icon: pickupIcon }).addTo(map).bindPopup(${JSON.stringify(pickup.title)});
          L.marker([${dropoff.lat}, ${dropoff.lng}], { icon: dropoffIcon }).addTo(map).bindPopup(${JSON.stringify(dropoff.title)});

          var coords = ${latlngs};
          if (coords && coords.length > 0) {
            var polyline = L.polyline(coords, { color: '#0F5132', weight: 5, opacity: 0.9 }).addTo(map);
            map.fitBounds(polyline.getBounds(), { paddingBottomRight: [40, 360], paddingTopLeft: [40, 80] });
          } else {
            var bounds = L.latLngBounds([[${pickup.lat}, ${pickup.lng}], [${dropoff.lat}, ${dropoff.lng}]]);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        </script>
      </body>
      </html>
    `;
  }, [pickup.lat, pickup.lng, pickup.title, dropoff.lat, dropoff.lng, dropoff.title, routeCoords, tileUrl]);

  const WV: any = WebView;

  return (
    <View style={StyleSheet.absoluteFill}>
      <WV
        ref={webViewRef}
        source={{ html }}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
