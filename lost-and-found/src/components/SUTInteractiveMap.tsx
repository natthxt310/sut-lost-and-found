import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { LatLng, getLocationCoords } from '../services/locationService';
import { SUT_LOCATIONS_DATA } from '../data/locationsData';
import { PostItem } from '../types';

/**
 * =========================================================================
 * 🗺️ แผนที่ มทส. แบบ Interactive (SUT Comprehensive 28+ Map Component)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. ปักหมุดทุกสถานที่ใน มทส. (28+ แห่ง 7 โซน) จากฐานข้อมูล locationsData.ts
 * 2. หากสถานที่ใดมี "ของหาย" หรือ "พบของ" จะแสดงหมุดสีแดง/เขียวกระพริบพร้อมชื่อสิ่งของและรูปภาพ
 * 3. แสดงหมุดสีฟ้ากระพริบ "ตำแหน่งของคุณ" (User GPS Live Location)
 * 4. เมื่อแตะหมุดสิ่งของ สามารถกดเปิดดูรายละเอียดโพสต์ได้ทันที
 * =========================================================================
 */

interface SUTInteractiveMapProps {
  userLocation: LatLng;
  posts: PostItem[];
  allPosts?: PostItem[];
  onSelectPost: (post: PostItem) => void;
}

export const SUTInteractiveMap: React.FC<SUTInteractiveMapProps> = ({
  userLocation,
  posts,
  allPosts,
  onSelectPost,
}) => {
  const activePosts = allPosts && allPosts.length > 0 ? allPosts : posts;

  // จัดหมวดหมู่สถานที่และตรวจสอบว่าสถานที่ใดมีของหายหรือพบของอยู่
  const locationsWithItems = SUT_LOCATIONS_DATA.map((loc) => {
    // หาโพสต์ที่ตรงกับสถานที่นี้
    const matchingPosts = activePosts.filter((p) => {
      const pLoc = (p.location || '').toLowerCase();
      const locName = loc.name.toLowerCase();
      const locDesc = (loc.desc || '').toLowerCase();

      return (
        pLoc === locName ||
        locName.includes(pLoc) ||
        pLoc.includes(locName) ||
        (loc.id === 'b1' && (pLoc.includes('b1') || pLoc.includes('เรียนรวม 1'))) ||
        (loc.id === 'b2' && (pLoc.includes('b2') || pLoc.includes('เรียนรวม 2'))) ||
        (loc.id === 'library' && (pLoc.includes('หอสมุด') || pLoc.includes('บรรณสาร'))) ||
        (loc.id === 'canteen-kasalong' && (pLoc.includes('กาสะลอง') || pLoc.includes('โรงอาหารสุรนิเวศน์'))) ||
        (loc.id === 'dorm-men' && (pLoc.includes('หอ 7') || pLoc.includes('หอพักชาย') || pLoc.includes('สุรนิเวศ 7'))) ||
        (loc.id === 'dorm-women' && (pLoc.includes('หอ 1') || pLoc.includes('หอพักหญิง') || pLoc.includes('สุรนิเวศ 1'))) ||
        (loc.id === 'hospital' && (pLoc.includes('โรงพยาบาล') || pLoc.includes('รพ.มทส.')))
      );
    });

    const lostItems = matchingPosts.filter((p) => p.type === 'lost' && p.status !== 'returned');
    const foundItems = matchingPosts.filter((p) => p.type === 'found' && p.status !== 'returned');

    return {
      id: loc.id,
      name: loc.name,
      zone: loc.zone,
      desc: loc.desc,
      lat: loc.coords.lat,
      lng: loc.coords.lng,
      hasItems: matchingPosts.length > 0,
      lostCount: lostItems.length,
      foundCount: foundItems.length,
      items: matchingPosts.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        status: p.status,
        imageUrl: p.imageUrl || '',
        category: p.category,
        dateTime: p.dateTime,
      })),
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
    * { box-sizing: border-box; }
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
    }
    .user-pulse-dot {
      width: 18px;
      height: 18px;
      background: #0055D4;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(0, 85, 212, 0.9);
      animation: userPulse 2s infinite;
    }
    @keyframes userPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 85, 212, 0.7); }
      70% { transform: scale(1.15); box-shadow: 0 0 0 14px rgba(0, 85, 212, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 85, 212, 0); }
    }

    /* Landmark Label Pins */
    .landmark-pin {
      background: rgba(15, 23, 42, 0.88);
      color: #F8FAFC;
      border: 1.5px solid #FF7A00;
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .landmark-pin:hover {
      transform: scale(1.08);
      z-index: 9999;
    }

    /* Item Glowing Pins (ของหาย / พบของ) */
    .item-glow-pin {
      position: relative;
      background: #FFFFFF;
      border-radius: 20px;
      padding: 4px 10px 4px 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      cursor: pointer;
      animation: itemBounce 2.5s infinite;
    }
    @keyframes itemBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .pin-lost-style {
      border: 2.5px solid #EF4444;
      color: #991B1B;
    }
    .pin-found-style {
      border: 2.5px solid #10B981;
      color: #065F46;
    }
    .pin-badge-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-lost { background: #EF4444; box-shadow: 0 0 6px #EF4444; }
    .dot-found { background: #10B981; box-shadow: 0 0 6px #10B981; }

    /* Custom Leaflet Popup */
    .leaflet-popup-content-wrapper {
      background: #1E293B;
      color: #F8FAFC;
      border-radius: 16px;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      padding: 2px;
    }
    .leaflet-popup-tip {
      background: #1E293B;
    }
    .popup-box {
      padding: 8px 10px;
      font-size: 13px;
    }
    .popup-title {
      font-size: 14px;
      font-weight: 800;
      color: #FF7A00;
      margin-bottom: 2px;
    }
    .popup-zone {
      font-size: 11px;
      color: #94A3B8;
      margin-bottom: 8px;
    }
    .popup-item-card {
      background: #0F172A;
      border-radius: 10px;
      padding: 8px;
      margin-top: 6px;
      border-left: 3px solid #FF7A00;
    }
    .popup-btn {
      margin-top: 6px;
      width: 100%;
      background: #FF7A00;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
    }
    .popup-btn:active {
      background: #E56B00;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const userLat = ${userLocation.lat};
    const userLng = ${userLocation.lng};
    const locationsData = ${JSON.stringify(locationsWithItems)};

    // เริ่มต้นแผนที่โฟกัสที่ มทส.
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([userLat, userLng], 16);

    // OpenStreetMap CartoDB Dark/Voyager or standard OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // 1. 🔵 หมุดตำแหน่งผู้ใช้ปัจจุบัน (User GPS Location)
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-dot"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup('<div class="popup-box"><div class="popup-title">📍 ตำแหน่งของคุณ</div><div class="popup-zone">มหาวิทยาลัยเทคโนโลยีสุรนารี</div></div>')
      .addTo(map);

    // 2. 🏛️ ปักหมุดทุกสถานที่ใน มทส. (28+ แห่ง)
    locationsData.forEach(function(loc) {
      if (loc.hasItems) {
        // ✨ สถานที่ที่มีของหายหรือพบของ -> แสดงหมุด Item Glow Pin ชัดเจน
        const hasLost = loc.lostCount > 0;
        const mainItem = loc.items[0];
        const badgeClass = hasLost ? 'pin-lost-style' : 'pin-found-style';
        const dotClass = hasLost ? 'dot-lost' : 'dot-found';
        const itemTypeLabel = hasLost ? '🔴 หาย: ' : '🟢 พบ: ';

        const itemPinHtml = '<div class="item-glow-pin ' + badgeClass + '">' +
          '<div class="pin-badge-dot ' + dotClass + '"></div>' +
          '<span>' + itemTypeLabel + mainItem.title + '</span>' +
        '</div>';

        const itemIcon = L.divIcon({
          className: '',
          html: itemPinHtml,
          iconSize: [160, 32],
          iconAnchor: [80, 16]
        });

        // Popup สำหรับสถานที่ที่มีของ
        let itemsHtml = '';
        loc.items.forEach(function(it) {
          const isLost = it.type === 'lost';
          itemsHtml += '<div class="popup-item-card" style="border-left-color: ' + (isLost ? '#EF4444' : '#10B981') + ';">' +
            '<div style="font-weight: 800; color: #FFFFFF;">' + (isLost ? '🔴 ของหาย: ' : '🟢 พบของ: ') + it.title + '</div>' +
            '<div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">' + (it.dateTime || '') + '</div>' +
            '<button class="popup-btn" onclick="sendPostClick(\\'' + it.id + '\\')">ดูรายละเอียดสิ่งของ</button>' +
          '</div>';
        });

        const popupContent = '<div class="popup-box">' +
          '<div class="popup-title">📍 ' + loc.name + '</div>' +
          '<div class="popup-zone">' + loc.zone + ' • พบรายการ ' + loc.items.length + ' รายการ</div>' +
          itemsHtml +
        '</div>';

        const itemMarker = L.marker([loc.lat, loc.lng], { icon: itemIcon, zIndexOffset: 1000 })
          .bindPopup(popupContent)
          .addTo(map);

        itemMarker.on('click', function() {
          // ถ้ามี 1 ชิ้นและคลิกหมุด สามารถเปิดได้
          if (loc.items.length === 1 && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(loc.items[0].id);
          }
        });

      } else {
        // 🏛️ สถานที่ทั่วไปใน มทส. (ยังไม่มีของ) -> แสดงหมุด Landmark Label สวยงาม
        const landmarkHtml = '<div class="landmark-pin">' +
          '<span>📍 ' + loc.name + '</span>' +
        '</div>';

        const landmarkIcon = L.divIcon({
          className: '',
          html: landmarkHtml,
          iconSize: [140, 24],
          iconAnchor: [70, 12]
        });

        const popupContent = '<div class="popup-box">' +
          '<div class="popup-title">🏛️ ' + loc.name + '</div>' +
          '<div class="popup-zone">' + loc.zone + '</div>' +
          '<div style="font-size: 12px; color: #CBD5E1; line-height: 1.4;">' + loc.desc + '</div>' +
          '<div style="margin-top: 8px; font-size: 11px; color: #94A3B8; font-style: italic;">ยังไม่มีรายการแจ้งของหายในบริเวณนี้</div>' +
        '</div>';

        L.marker([loc.lat, loc.lng], { icon: landmarkIcon, zIndexOffset: 100 })
          .bindPopup(popupContent)
          .addTo(map);
      }
    });

    function sendPostClick(postId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(postId);
      }
    }
  </script>
</body>
</html>
`;

  const handleMessage = (event: any) => {
    try {
      const postId = event.nativeEvent.data;
      const target = activePosts.find((p) => p.id === postId);
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
    backgroundColor: '#0F172A',
  },
});
