import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { LatLng, getLocationCoords } from '../services/locationService';
import { PostItem } from '../types';

/**
 * =========================================================================
 * 🗺️ แผนที่ มทส. แบบ Interactive (SUT Real Map Component)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. แสดงแผนที่จริงของมหาวิทยาลัยเทคโนโลยีสุรนารี ผ่าน OpenStreetMap + Leaflet.js
 * 2. ปักหมุดตำแหน่งสิ่งของที่หาย/พบจริง (Lost & Found Pins) พร้อมรูปและข้อมูล
 * 3. แสดงหมุดสีฟ้ากระพริบ "ตำแหน่งของคุณ" (User Real GPS Location)
 * 4. รองรับการแตะเลือกหมุดบนแผนที่เพื่อดูรายละเอียดสิ่งของ
 * =========================================================================
 */

interface SUTInteractiveMapProps {
  userLocation: LatLng;
  posts: PostItem[];
  onSelectPost: (post: PostItem) => void;
}

export const SUTInteractiveMap: React.FC<SUTInteractiveMapProps> = ({
  userLocation,
  posts,
  onSelectPost,
}) => {
  // สร้าง JSON ข้อมูลหมุดสิ่งของ
  const markersData = posts.map((post) => {
    const coords = getLocationCoords(post.location);
    return {
      id: post.id,
      title: post.title,
      location: post.location,
      type: post.type,
      lat: coords.lat,
      lng: coords.lng,
      imageUrl: post.imageUrl || '',
    };
  });

  // สร้าง HTML สำหรับ Leaflet Map
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #E8F5E9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .user-pulse-dot {
      width: 16px;
      height: 16px;
      background: #0055D4;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 85, 212, 0.8);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 85, 212, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(0, 85, 212, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 85, 212, 0); }
    }
    .custom-pin {
      width: 34px;
      height: 34px;
      border-radius: 17px;
      background: #FFFFFF;
      border: 2.5px solid #FF7A00;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.25);
      font-size: 16px;
      cursor: pointer;
    }
    .pin-lost { border-color: #EF4444; }
    .pin-found { border-color: #10B981; }
    .sut-building-label {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #FF7A00;
      border-radius: 8px;
      padding: 3px 8px;
      font-weight: 700;
      font-size: 11px;
      color: #1E293B;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const userLat = ${userLocation.lat};
    const userLng = ${userLocation.lng};
    const markers = ${JSON.stringify(markersData)};

    // เริ่มต้นแผนที่โฟกัสที่ มทส.
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([userLat, userLng], 17);

    // ใช้ OpenStreetMap Tile Layer คมชัดสูง
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // 1. หมุดตำแหน่งผู้ใช้ปัจจุบัน (User GPS Location)
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup('<b>📍 ตำแหน่งของคุณ</b><br>มหาวิทยาลัยเทคโนโลยีสุรนารี')
      .addTo(map);

    // 2. หมุดสถานที่สำคัญใน มทส.
    const sutLandmarks = [
      { name: "อาคารเรียนรวม 1 (B1)", lat: 14.88350, lng: 102.02100 },
      { name: "อาคารเรียนรวม 2 (B2)", lat: 14.88280, lng: 102.02150 },
      { name: "ศูนย์บรรณสารฯ (หอสมุด)", lat: 14.88200, lng: 102.02050 },
      { name: "U-Store / Fresh Me", lat: 14.88320, lng: 102.02080 },
      { name: "โรงอาหารสุรนิเวศน์", lat: 14.88120, lng: 102.01950 }
    ];

    sutLandmarks.forEach(function(lm) {
      const labelIcon = L.divIcon({
        className: 'sut-building-label',
        html: lm.name,
        iconSize: [120, 20],
        iconAnchor: [60, 10]
      });
      L.marker([lm.lat, lm.lng], { icon: labelIcon }).addTo(map);
    });

    // 3. หมุดสิ่งของที่หาย / พบจริง (Items Pins)
    markers.forEach(function(item) {
      const isLost = item.type === 'lost';
      const iconHtml = '<div class="custom-pin ' + (isLost ? 'pin-lost' : 'pin-found') + '">' +
        (isLost ? '🔴' : '🟢') +
      '</div>';

      const itemIcon = L.divIcon({
        className: '',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const popupContent = '<div style="font-size: 13px;">' +
        '<b>' + item.title + '</b><br>' +
        '<span style="color: #64748B;">' + item.location + '</span><br>' +
        '<button onclick="window.ReactNativeWebView.postMessage(\\'' + item.id + '\\')" ' +
        'style="margin-top: 6px; background: #FF7A00; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">ดูรายละเอียด</button>' +
      '</div>';

      const marker = L.marker([item.lat, item.lng], { icon: itemIcon })
        .bindPopup(popupContent)
        .addTo(map);

      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(item.id);
        }
      });
    });
  </script>
</body>
</html>
`;

  const handleMessage = (event: any) => {
    try {
      const postId = event.nativeEvent.data;
      const target = posts.find((p) => p.id === postId);
      if (target) {
        onSelectPost(target);
      }
    } catch {
      //
    }
  };

  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
});
