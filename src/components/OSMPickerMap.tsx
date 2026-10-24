import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface OSMPickerMapProps {
  initialLat: number;
  initialLng: number;
  onCenterChange: (lat: number, lng: number) => void;
}

export default function OSMPickerMap({ initialLat, initialLng, onCenterChange }: OSMPickerMapProps) {
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(() => {
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
          var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          var debounceTimer = null;
          function postCenter() {
            var c = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng }));
          }

          map.on('move', function() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(postCenter, 250);
          });
        </script>
      </body>
      </html>
    `;
  }, [initialLat, initialLng]);

  const WV: any = WebView;

  return (
    <View style={StyleSheet.absoluteFill}>
      <WV
        ref={webViewRef}
        source={{ html }}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.lat && data.lng) {
              onCenterChange(data.lat, data.lng);
            }
          } catch (e) {}
        }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
