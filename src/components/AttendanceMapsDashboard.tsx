import React, { useState, useMemo, useRef, useEffect } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Building2,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Compass,
  Maximize2,
  Minimize2,
  LogOut,
  Radio,
  User,
  ArrowUpRight,
  Crosshair,
  Map as MapIcon
} from 'lucide-react';
import { AttendanceRecord, CompanyConfig, Employee, Shift } from '../types';

interface AttendanceMapsDashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  config: CompanyConfig;
  shifts: Shift[];
  initialSelectedEmployeeId?: string;
}

export const AttendanceMapsDashboard: React.FC<AttendanceMapsDashboardProps> = ({
  employees,
  attendanceRecords,
  config,
  shifts,
  initialSelectedEmployeeId,
}) => {
  // Map engine: Google Roadmap, Google Satellite Hybrid, OpenStreetMap, or Futuristic Radar
  const [mapEngine, setMapEngine] = useState<'google' | 'google-satellite' | 'osm' | 'radar'>('google');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [mapTheme, setMapTheme] = useState<'dark' | 'blueprint'>('dark');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'out_radius' | 'checked_out'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(initialSelectedEmployeeId || null);
  const [selectedRecordType, setSelectedRecordType] = useState<'checkin' | 'checkout'>('checkin');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filter attendance records for today (or latest records)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayRecords = useMemo(() => {
    const directToday = attendanceRecords.filter((a) => a.date === todayStr);
    if (directToday.length > 0) return directToday;

    // Fallback to latest available records so the map is populated in demonstration
    const uniqueByEmp = new Map<string, AttendanceRecord>();
    const sorted = [...attendanceRecords].sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach((rec) => {
      if (!uniqueByEmp.has(rec.employeeId)) {
        uniqueByEmp.set(rec.employeeId, rec);
      }
    });
    return Array.from(uniqueByEmp.values());
  }, [attendanceRecords, todayStr]);

  // Combine employee data with their attendance record and coordinates
  const employeeMapData = useMemo(() => {
    return employees.map((emp) => {
      const record = todayRecords.find(
        (r) => r.employeeId.trim().toUpperCase() === emp.id.trim().toUpperCase()
      );
      const shift = shifts.find((s) => s.id === emp.currentShiftId) || shifts[0];

      const checkInLat = record?.checkInLat;
      const checkInLng = record?.checkInLng;
      const checkOutLat = record?.checkOutLat;
      const checkOutLng = record?.checkOutLng;

      const hasCheckIn = Boolean(checkInLat && checkInLng);
      const hasCheckOut = Boolean(record?.checkOutTime && checkOutLat && checkOutLng);

      const distanceMeters = record?.checkInDistanceMeters ?? 0;
      const isOutRadius = distanceMeters > config.officeRadiusMeters;

      let statusType: 'working' | 'out_radius' | 'checked_out' | 'none' = 'none';
      if (hasCheckOut) {
        statusType = 'checked_out';
      } else if (hasCheckIn) {
        statusType = isOutRadius ? 'out_radius' : 'working';
      }

      return {
        employee: emp,
        record,
        shift,
        hasCheckIn,
        hasCheckOut,
        checkInLat,
        checkInLng,
        checkOutLat,
        checkOutLng,
        distanceMeters,
        isOutRadius,
        statusType,
      };
    });
  }, [employees, todayRecords, shifts, config.officeRadiusMeters]);

  // Filtered map data based on filter buttons & search
  const filteredMapData = useMemo(() => {
    return employeeMapData.filter((item) => {
      if (!item.hasCheckIn) return false;

      if (statusFilter === 'working' && item.statusType !== 'working') return false;
      if (statusFilter === 'out_radius' && item.statusType !== 'out_radius') return false;
      if (statusFilter === 'checked_out' && item.statusType !== 'checked_out') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.employee.name.toLowerCase().includes(q) ||
          item.employee.id.toLowerCase().includes(q) ||
          item.employee.department.toLowerCase().includes(q) ||
          item.employee.position.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [employeeMapData, statusFilter, searchQuery]);

  // Selected item object
  const selectedItem = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employeeMapData.find(
      (item) => item.employee.id.trim().toUpperCase() === selectedEmployeeId.trim().toUpperCase()
    ) || null;
  }, [employeeMapData, selectedEmployeeId]);

  // Office center coordinate
  const officeLat = config.officeLat || -6.2232;
  const officeLng = config.officeLng || 106.8093;
  const officeRadius = config.officeRadiusMeters || 100;

  // Active GPS coordinates for focus
  const activeLat = selectedItem
    ? (selectedRecordType === 'checkin' ? selectedItem.record?.checkInLat : selectedItem.record?.checkOutLat) || officeLat
    : officeLat;
  const activeLng = selectedItem
    ? (selectedRecordType === 'checkin' ? selectedItem.record?.checkInLng : selectedItem.record?.checkOutLng) || officeLng
    : officeLng;

  // Quick stats
  const totalCheckedIn = employeeMapData.filter((e) => e.hasCheckIn).length;
  const totalInRadius = employeeMapData.filter((e) => e.statusType === 'working').length;
  const totalOutRadius = employeeMapData.filter((e) => e.statusType === 'out_radius').length;
  const totalCheckedOut = employeeMapData.filter((e) => e.statusType === 'checked_out').length;

  // -------------------------------------------------------------
  // LEAFLET GOOGLE MAPS INTEGRATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine === 'radar' || !mapContainerRef.current) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
        tileLayerRef.current = null;
        markersMapRef.current.clear();
      }
      return;
    }

    // Initialize Leaflet map if not yet created
    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([officeLat, officeLng], 16);

      leafletMapRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = leafletMapRef.current;

    // Remove previous tile layer if any
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Determine tile URL based on mapEngine
    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Maps';
    let maxZoom = 21;

    if (mapEngine === 'google-satellite') {
      // Google Hybrid (Satellite + Roads + Labels)
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Satelit Hybrid';
      maxZoom = 21;
    } else if (mapEngine === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxZoom = 19;
    }

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      attribution,
      subdomains: mapEngine.startsWith('google') ? ['mt0', 'mt1', 'mt2', 'mt3'] : ['a', 'b', 'c'],
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Force map to invalidate size on render
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      // Keep map instance alive across rerenders unless engine changes to radar
    };
  }, [mapEngine, officeLat, officeLng]);

  // Render Markers and Geofence on the Leaflet Map
  useEffect(() => {
    if (mapEngine === 'radar' || !leafletMapRef.current || !markersLayerRef.current) return;

    const map = leafletMapRef.current;
    const layerGroup = markersLayerRef.current;
    layerGroup.clearLayers();
    markersMapRef.current.clear();

    // 1. Office Center Marker & Geofence Circle
    const officeIcon = L.divIcon({
      className: 'custom-office-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 38px; height: 38px; border-radius: 12px; background: #0f172a; border: 3px solid #10b981; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 10;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          </div>
          <div style="background: #0f172a; border: 1.5px solid #10b981; color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 10;">
            🏢 ${config.companyName}
          </div>
        </div>
      `,
      iconSize: [48, 64],
      iconAnchor: [24, 30],
    });

    const officeMarker = L.marker([officeLat, officeLng], { icon: officeIcon }).addTo(layerGroup);
    officeMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <div style="font-weight: bold; color: #0f172a; font-size: 13px;">🏢 Kantor Pusat: ${config.companyName}</div>
        <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Titik Pusat Geofence Presensi GPS</div>
        <div style="margin-top: 6px; font-size: 11px; background: #ecfdf5; color: #047857; padding: 4px 8px; border-radius: 6px; font-weight: 600;">
          Radius Terverifikasi: ${officeRadius} Meter
        </div>
      </div>
    `);

    // Geofence Circle Overlay
    L.circle([officeLat, officeLng], {
      radius: officeRadius,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.16,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(layerGroup);

    // 2. LIVE WORKER DOTS & PINS
    filteredMapData.forEach((item) => {
      const lat =
        selectedRecordType === 'checkout' && item.checkOutLat
          ? item.checkOutLat
          : item.checkInLat || officeLat;
      const lng =
        selectedRecordType === 'checkout' && item.checkOutLng
          ? item.checkOutLng
          : item.checkInLng || officeLng;

      const isSelected = selectedEmployeeId === item.employee.id;

      // Color scheme
      const pinColor =
        item.statusType === 'checked_out'
          ? '#3b82f6'
          : item.statusType === 'out_radius'
          ? '#f59e0b'
          : '#10b981';

      const statusLabel =
        item.statusType === 'checked_out'
          ? 'Pulang (Check-Out)'
          : item.statusType === 'out_radius'
          ? 'Luar Radius / WFA'
          : 'Dalam Radius Kantor';

      const initials = item.employee.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('');

      const firstName = item.employee.name.split(' ')[0];

      // Custom Pin Marker with Live Pulse Ring & Name Badge
      const workerIcon = L.divIcon({
        className: 'custom-worker-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: transform 0.2s;">
            <!-- Live Pulse Dot Animation -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: 44px; height: 44px; border-radius: 50%; background: ${pinColor}; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            
            <!-- Core Marker Pin Bubble -->
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #0f172a; border: 3px solid ${pinColor}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 11px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); z-index: 20; position: relative;">
              ${initials}
              <!-- Small live status indicator dot -->
              <span style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background: ${pinColor}; border: 2px solid #0f172a;"></span>
            </div>

            <!-- Name and Distance Pill -->
            <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${pinColor}; color: #ffffff; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; margin-top: 3px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 20;">
              ${firstName} • ${item.distanceMeters}m
            </div>
          </div>
        `,
        iconSize: [44, 56],
        iconAnchor: [22, 28],
      });

      const marker = L.marker([lat, lng], { icon: workerIcon, zIndexOffset: isSelected ? 1000 : 100 }).addTo(layerGroup);
      markersMapRef.current.set(item.employee.id, marker);

      // Popup with full details
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 6px; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid ${pinColor};">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 12px; line-height: 1.2;">${item.employee.name}</div>
              <div style="color: #64748b; font-size: 10px;">ID: <strong>${item.employee.id}</strong> • ${item.employee.department}</div>
            </div>
          </div>
          
          <div style="background: ${pinColor}15; color: ${pinColor}; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-bottom: 6px; border: 1px solid ${pinColor}40;">
            ● ${statusLabel} (${item.distanceMeters}m dari kantor)
          </div>

          <div style="font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 8px;">
            <div>🕒 Jam Masuk: <strong>${item.record?.checkInTime || '-'} WIB</strong></div>
            ${item.record?.checkOutTime ? `<div>🕒 Jam Pulang: <strong>${item.record.checkOutTime} WIB</strong></div>` : ''}
            <div>📍 Koordinat: <span style="font-family: monospace; font-size: 10px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Shift: ${item.shift.name}</div>
          </div>

          <div style="display: flex; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #0f172a; color: white; padding: 5px; border-radius: 6px; font-size: 10px; font-weight: bold; text-decoration: none;">
              Buka Google Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedEmployeeId(item.employee.id);
      });
    });

    // If an employee is selected, center on them
    if (selectedEmployeeId && markersMapRef.current.has(selectedEmployeeId)) {
      const targetMarker = markersMapRef.current.get(selectedEmployeeId);
      if (targetMarker) {
        map.panTo(targetMarker.getLatLng(), { animate: true, duration: 0.8 });
        targetMarker.openPopup();
      }
    }
  }, [filteredMapData, selectedEmployeeId, selectedRecordType, mapEngine, officeLat, officeLng, officeRadius, config.companyName]);

  // Handle focus on selected employee
  const handleFocusEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (mapEngine !== 'radar' && leafletMapRef.current && markersMapRef.current.has(empId)) {
      const marker = markersMapRef.current.get(empId);
      if (marker) {
        leafletMapRef.current.flyTo(marker.getLatLng(), 17, { duration: 1 });
        marker.openPopup();
      }
    }
  };

  // Center on Office
  const handleCenterOffice = () => {
    setSelectedEmployeeId(null);
    if (mapEngine !== 'radar' && leafletMapRef.current) {
      leafletMapRef.current.flyTo([officeLat, officeLng], 16, { duration: 1 });
    } else {
      setZoomLevel(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Fit Bounds to Show All Workers
  const handleFitAllMarkers = () => {
    if (mapEngine !== 'radar' && leafletMapRef.current && markersLayerRef.current) {
      const map = leafletMapRef.current;
      const points: L.LatLngExpression[] = [[officeLat, officeLng]];
      filteredMapData.forEach((item) => {
        const lat =
          selectedRecordType === 'checkout' && item.checkOutLat
            ? item.checkOutLat
            : item.checkInLat || officeLat;
        const lng =
          selectedRecordType === 'checkout' && item.checkOutLng
            ? item.checkOutLng
            : item.checkInLng || officeLng;
        points.push([lat, lng]);
      });
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 18 });
      }
    }
  };

  // Zoom controls for Leaflet / Radar
  const handleZoomIn = () => {
    if (mapEngine !== 'radar' && leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    } else {
      setZoomLevel((prev) => Math.min(prev * 1.25, 4.0));
    }
  };

  const handleZoomOut = () => {
    if (mapEngine !== 'radar' && leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    } else {
      setZoomLevel((prev) => Math.max(prev * 0.8, 0.4));
    }
  };

  // Radar Geofence SVG calculation
  const viewBoxWidth = 1000;
  const viewBoxHeight = 700;
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;
  const baseScale = 1.2 * zoomLevel;
  const metersToSvg = (meters: number) => meters * baseScale;

  const coordsToSvg = (lat: number, lng: number) => {
    const deltaLat = lat - officeLat;
    const deltaLng = lng - officeLng;
    const deltaY_meters = deltaLat * 111320;
    const deltaX_meters = deltaLng * 111320 * Math.cos((officeLat * Math.PI) / 180);
    const x = centerX + deltaX_meters * baseScale + panOffset.x;
    const y = centerY - deltaY_meters * baseScale + panOffset.y;
    return { x, y, deltaX_meters, deltaY_meters };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Peta Presensi GPS & Titik Live Pekerja</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Points Aktif
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visualisasi titik-titik koordinat pekerja secara langsung pada Google Maps dan zona radius kantor ({config.companyName}).
              </p>
            </div>
          </div>
        </div>

        {/* Map Engine Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setMapEngine('google')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mapEngine === 'google' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Google Maps</span>
            </button>
            <button
              type="button"
              onClick={() => setMapEngine('google-satellite')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mapEngine === 'google-satellite' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>Google Satelit</span>
            </button>
            <button
              type="button"
              onClick={() => setMapEngine('osm')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mapEngine === 'osm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>OpenStreetMap</span>
            </button>
            <button
              type="button"
              onClick={() => setMapEngine('radar')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mapEngine === 'radar' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Radar Geofence</span>
            </button>
          </div>

          {/* Fit all markers button */}
          {mapEngine !== 'radar' && (
            <button
              type="button"
              onClick={handleFitAllMarkers}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Perlihatkan Semua Pekerja di Peta"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Lihat Semua Pekerja</span>
            </button>
          )}

          {/* Reset Center */}
          <button
            type="button"
            onClick={handleCenterOffice}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Pusatkan Kembali ke Kantor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kantor</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-700 shadow-sm ring-2 ring-slate-500'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-slate-500 font-semibold mb-0.5">Total Titik di Peta</div>
          <div className="text-xl font-black text-slate-900">{totalCheckedIn}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pekerja Aktif Hari Ini</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('working')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'working'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-600 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-emerald-50/50 border-emerald-200'
          }`}
        >
          <div className="text-emerald-700 font-semibold mb-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dalam Radius Kantor</span>
          </div>
          <div className="text-xl font-black text-emerald-700">{totalInRadius}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">&le; {officeRadius}m Radius</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('out_radius')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'out_radius'
              ? 'bg-amber-950 text-amber-100 border-amber-600 shadow-sm ring-2 ring-amber-400'
              : 'bg-white hover:bg-amber-50/50 border-amber-200'
          }`}
        >
          <div className="text-amber-700 font-semibold mb-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Luar Radius / WFA</span>
          </div>
          <div className="text-xl font-black text-amber-700">{totalOutRadius}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">&gt; {officeRadius}m dari Kantor</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('checked_out')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'checked_out'
              ? 'bg-blue-950 text-blue-100 border-blue-600 shadow-sm ring-2 ring-blue-400'
              : 'bg-white hover:bg-blue-50/50 border-blue-200'
          }`}
        >
          <div className="text-blue-700 font-semibold mb-0.5 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5 text-blue-500" />
            <span>Selesai (Check-Out)</span>
          </div>
          <div className="text-xl font-black text-blue-700">{totalCheckedOut}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Sudah Pulang</div>
        </button>
      </div>

      {/* Main Map & Interactive Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Canvas Column */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative flex flex-col">
          {/* Map Floating HUD Overlay */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 pointer-events-auto">
            {/* Geofence Info Badge */}
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-white shadow-lg text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>{config.companyName}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {officeLat.toFixed(5)}, {officeLng.toFixed(5)} • Radius: {officeRadius}m
              </div>
            </div>

            {/* Legend overlay */}
            <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 text-[10px] text-slate-300 shadow-lg space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-950 shrink-0 animate-pulse" />
                <span>Pekerja di Dalam Radius</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-950 shrink-0" />
                <span>Pekerja di Luar Radius (WFA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-950 shrink-0" />
                <span>Pekerja Sudah Check-Out</span>
              </div>
            </div>
          </div>

          {/* Floating Map Zoom & Action Buttons */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-2xl pointer-events-auto">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              title="Perbesar Peta (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              title="Perkecil Peta (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {mapEngine !== 'radar' && (
              <button
                type="button"
                onClick={handleFitAllMarkers}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer"
                title="Pusatkan Semua Titik Pekerja"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCenterOffice}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              title="Pusatkan ke Kantor"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Map View Canvas: Leaflet Google Maps with Live Dots vs Radar Geofence SVG */}
          {mapEngine !== 'radar' ? (
            <div className="w-full h-[480px] sm:h-[550px] relative bg-slate-950 overflow-hidden">
              {/* Leaflet DOM container */}
              <div
                ref={mapContainerRef}
                className="w-full h-full z-10"
                style={{ background: '#090d16' }}
              />

              {/* Floating Active Target Badge */}
              <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 items-end max-w-[80%] sm:max-w-md pointer-events-auto">
                <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-white shadow-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 animate-bounce shrink-0" />
                    <span className="font-bold text-slate-100 truncate">
                      {selectedItem ? selectedItem.employee.name : `Pusat Kantor: ${config.companyName}`}
                    </span>
                    {selectedItem && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
                        {selectedItem.distanceMeters}m
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-3">
                    <span>{activeLat.toFixed(5)}, {activeLng.toFixed(5)}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 font-sans"
                    >
                      <span>Buka Google Maps</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[480px] sm:h-[550px] relative select-none cursor-grab active:cursor-grabbing">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <defs>
                  <radialGradient id="geofenceGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#10b981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </radialGradient>
                  <pattern
                    id="mapGrid"
                    width={60 * zoomLevel}
                    height={60 * zoomLevel}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${panOffset.x % (60 * zoomLevel)}, ${panOffset.y % (60 * zoomLevel)})`}
                  >
                    <path
                      d={`M ${60 * zoomLevel} 0 L 0 0 0 ${60 * zoomLevel}`}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                <rect width={viewBoxWidth} height={viewBoxHeight} fill="#090d16" />
                <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#mapGrid)" />

                {/* Concentric rings */}
                {[50, 100, 200, 350, 500].map((radiusM) => {
                  const rPixels = metersToSvg(radiusM);
                  const isGeofence = radiusM === officeRadius;
                  return (
                    <g key={radiusM}>
                      <circle
                        cx={centerX + panOffset.x}
                        cy={centerY + panOffset.y}
                        r={rPixels}
                        fill={isGeofence ? 'url(#geofenceGlow)' : 'none'}
                        stroke={isGeofence ? '#10b981' : 'rgba(148, 163, 184, 0.15)'}
                        strokeWidth={isGeofence ? '2.5' : '1'}
                        strokeDasharray={isGeofence ? 'none' : '4 4'}
                      />
                      <text
                        x={centerX + panOffset.x + rPixels + 4}
                        y={centerY + panOffset.y - 4}
                        fill={isGeofence ? '#10b981' : '#64748b'}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {radiusM}m
                      </text>
                    </g>
                  );
                })}

                {/* Animated radar ring */}
                <circle
                  cx={centerX + panOffset.x}
                  cy={centerY + panOffset.y}
                  r={metersToSvg(officeRadius)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  opacity="0.6"
                  className="animate-ping origin-center"
                />

                {/* Center Office Building Marker */}
                <g
                  transform={`translate(${centerX + panOffset.x}, ${centerY + panOffset.y})`}
                  className="cursor-pointer"
                  onClick={handleCenterOffice}
                >
                  <circle r="22" fill="#10b981" opacity="0.2" className="animate-pulse" />
                  <circle r="15" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" />
                  <foreignObject x="-9" y="-9" width="18" height="18">
                    <div className="w-full h-full flex items-center justify-center text-emerald-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </foreignObject>
                  <text
                    x="0"
                    y="26"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="drop-shadow"
                  >
                    {config.companyName}
                  </text>
                </g>

                {/* Employee Pins on SVG */}
                {filteredMapData.map((item) => {
                  const isSelected = selectedEmployeeId === item.employee.id;
                  const targetLat =
                    selectedRecordType === 'checkout' && item.checkOutLat
                      ? item.checkOutLat
                      : item.checkInLat || officeLat;
                  const targetLng =
                    selectedRecordType === 'checkout' && item.checkOutLng
                      ? item.checkOutLng
                      : item.checkInLng || officeLng;

                  const pos = coordsToSvg(targetLat, targetLng);
                  const pinColor =
                    item.statusType === 'checked_out'
                      ? '#3b82f6'
                      : item.statusType === 'out_radius'
                      ? '#f59e0b'
                      : '#10b981';

                  return (
                    <g
                      key={item.employee.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-transform duration-150 hover:scale-110"
                      onClick={() => handleFocusEmployee(item.employee.id)}
                    >
                      {isSelected && (
                        <circle
                          r="24"
                          fill="none"
                          stroke={pinColor}
                          strokeWidth="2"
                          className="animate-ping"
                        />
                      )}
                      <circle
                        r={isSelected ? '16' : '13'}
                        fill="#0f172a"
                        stroke={pinColor}
                        strokeWidth={isSelected ? '3' : '2'}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isSelected ? '9' : '8'}
                        fontWeight="bold"
                      >
                        {item.employee.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </text>
                      <circle
                        cx="9"
                        cy="-9"
                        r="4"
                        fill={pinColor}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <g transform="translate(0, 22)">
                        <rect
                          x="-45"
                          y="-7"
                          width="90"
                          height="16"
                          rx="8"
                          fill="#090d16"
                          stroke={isSelected ? pinColor : 'rgba(255,255,255,0.15)'}
                          strokeWidth={isSelected ? '1.5' : '1'}
                          opacity="0.95"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {item.employee.name.split(' ')[0]} ({item.distanceMeters}m)
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Sidebar: Details Card & Attendee List */}
        <div className="space-y-3.5 flex flex-col justify-between">
          {/* Selected Pin Details Box */}
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm border-2 border-emerald-500">
                    {selectedItem.employee.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{selectedItem.employee.name}</h3>
                    <div className="text-xs text-slate-500">
                      ID: <strong className="text-slate-800">{selectedItem.employee.id}</strong> • {selectedItem.employee.department}
                    </div>
                    <div className="text-[11px] text-slate-400">{selectedItem.employee.position}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status and distance badge */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedItem.statusType === 'checked_out'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : selectedItem.statusType === 'out_radius'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedItem.statusType === 'checked_out'
                        ? 'bg-blue-500'
                        : selectedItem.statusType === 'out_radius'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>
                    {selectedItem.statusType === 'checked_out'
                      ? 'Sudah Pulang'
                      : selectedItem.statusType === 'out_radius'
                      ? 'Luar Radius / WFA'
                      : 'Dalam Radius Kantor'}
                  </span>
                </span>

                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                  {selectedItem.distanceMeters}m dari kantor
                </span>
              </div>

              {/* Checkin / Checkout Details Tab */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Jam Check-In:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedItem.record?.checkInTime || '-'} WIB
                  </span>
                </div>

                {selectedItem.record?.checkOutTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jam Check-Out:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedItem.record.checkOutTime} WIB
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Koordinat GPS:</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {selectedItem.checkInLat?.toFixed(5)}, {selectedItem.checkInLng?.toFixed(5)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Shift Kerja:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedItem.shift.name} ({selectedItem.shift.startTime} - {selectedItem.shift.endTime})
                  </span>
                </div>
              </div>

              {/* Direct Action Links */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedItem.checkInLat && selectedItem.checkInLng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.checkInLat},${selectedItem.checkInLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span>Buka Titik di Google Maps Asli</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  </a>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${officeLat},${officeLng}&destination=${selectedItem.checkInLat},${selectedItem.checkInLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rute Perjalanan dari Kantor</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">Pilih Titik Pekerja di Peta</div>
              <p className="text-[11px] text-slate-500">
                Klik titik poin pekerja di atas peta Google atau pilih dari daftar karyawan di bawah untuk melihat rincian koordinat presisi dan rute.
              </p>
            </div>
          )}

          {/* Attendee Quick List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex-1 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Daftar Titik Pekerja Live ({filteredMapData.length})</span>
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama karyawan di peta..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto max-h-56 space-y-1.5 pr-1 scrollbar-thin">
              {filteredMapData.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Tidak ada data presensi GPS yang cocok.
                </div>
              ) : (
                filteredMapData.map((item) => {
                  const isSelected = selectedEmployeeId === item.employee.id;
                  const pinColor =
                    item.statusType === 'checked_out'
                      ? 'bg-blue-500'
                      : item.statusType === 'out_radius'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <button
                      key={item.employee.id}
                      type="button"
                      onClick={() => handleFocusEmployee(item.employee.id)}
                      className={`w-full p-2 rounded-xl text-left text-xs transition cursor-pointer flex items-center justify-between gap-2 border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${pinColor} shrink-0 animate-pulse`} />
                        <div className="truncate">
                          <div className="font-bold truncate">{item.employee.name}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {item.employee.department} • {item.distanceMeters}m
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-[10px] font-bold">
                          {item.record?.checkInTime || '-'}
                        </div>
                        <div
                          className={`text-[9px] ${
                            isSelected ? 'text-emerald-300' : 'text-emerald-700 font-semibold'
                          }`}
                        >
                          {item.statusType === 'checked_out'
                            ? 'Pulang'
                            : item.isOutRadius
                            ? 'WFA'
                            : 'Di Kantor'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Watermark Note */}
      <div className="py-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistem Peta Geofence GPS • Dibuat oleh <strong className="text-emerald-700 font-semibold">heruhendri</strong></span>
        </div>
      </div>
    </div>
  );
};
