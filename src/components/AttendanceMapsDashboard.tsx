import React, { useState, useMemo, useRef } from 'react';
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
  ArrowUpRight
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
  const [mapEngine, setMapEngine] = useState<'google' | 'google-satellite' | 'radar'>('google');
  const [googleZoom, setGoogleZoom] = useState<number>(16);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [mapTheme, setMapTheme] = useState<'dark' | 'blueprint' | 'satellite'>('dark');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'out_radius' | 'checked_out'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(initialSelectedEmployeeId || null);
  const [selectedRecordType, setSelectedRecordType] = useState<'checkin' | 'checkout'>('checkin');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filter attendance records for today (or latest records)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayRecords = useMemo(() => {
    const directToday = attendanceRecords.filter((a) => a.date === todayStr);
    if (directToday.length > 0) return directToday;

    // Fallback to the latest available records so the map is never empty in demo
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
      const record = todayRecords.find((r) => r.employeeId === emp.id);
      const shift = shifts.find((s) => s.id === emp.currentShiftId) || shifts[0];

      // Determine GPS location: checkInLat/Lng or simulated slight variation if recorded
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
    return employeeMapData.find((item) => item.employee.id === selectedEmployeeId) || null;
  }, [employeeMapData, selectedEmployeeId]);

  // Office center coordinate
  const officeLat = config.officeLat || -6.2232;
  const officeLng = config.officeLng || 106.8093;
  const officeRadius = config.officeRadiusMeters || 100;

  // Map canvas sizing
  const viewBoxWidth = 1000;
  const viewBoxHeight = 700;
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;

  // Projection: convert delta meters to SVG pixels
  // At zoom 1.0, 100 meters = 120 pixels in SVG
  const baseScale = 1.2 * zoomLevel; // pixels per meter

  const metersToSvg = (meters: number) => meters * baseScale;

  // Convert (lat, lng) to SVG coordinates relative to office center
  const coordsToSvg = (lat: number, lng: number) => {
    const deltaLat = lat - officeLat;
    const deltaLng = lng - officeLng;

    // 1 deg lat = ~111,320 meters
    const deltaY_meters = deltaLat * 111320;
    // 1 deg lng = ~111,320 * cos(lat) meters
    const deltaX_meters = deltaLng * 111320 * Math.cos((officeLat * Math.PI) / 180);

    const x = centerX + deltaX_meters * baseScale + panOffset.x;
    const y = centerY - deltaY_meters * baseScale + panOffset.y;

    return { x, y, deltaX_meters, deltaY_meters };
  };

  // Active GPS coordinates for Google Maps & focus
  const activeLat = selectedItem
    ? (selectedRecordType === 'checkin' ? selectedItem.record?.checkInLat : selectedItem.record?.checkOutLat) || officeLat
    : officeLat;
  const activeLng = selectedItem
    ? (selectedRecordType === 'checkin' ? selectedItem.record?.checkInLng : selectedItem.record?.checkOutLng) || officeLng
    : officeLng;

  // Google Maps Zoom
  const handleGoogleZoomIn = () => setGoogleZoom((prev) => Math.min(prev + 1, 21));
  const handleGoogleZoomOut = () => setGoogleZoom((prev) => Math.max(prev - 1, 4));

  // Zoom controls
  const handleZoomIn = () => {
    if (mapEngine !== 'radar') {
      handleGoogleZoomIn();
    } else {
      setZoomLevel((prev) => Math.min(prev * 1.25, 4.0));
    }
  };

  const handleZoomOut = () => {
    if (mapEngine !== 'radar') {
      handleGoogleZoomOut();
    } else {
      setZoomLevel((prev) => Math.max(prev * 0.8, 0.4));
    }
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setGoogleZoom(16);
    setPanOffset({ x: 0, y: 0 });
    setSelectedEmployeeId(null);
  };

  // Drag to pan map
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

  // Quick stats
  const totalCheckedIn = employeeMapData.filter((e) => e.hasCheckIn).length;
  const totalInRadius = employeeMapData.filter((e) => e.statusType === 'working').length;
  const totalOutRadius = employeeMapData.filter((e) => e.statusType === 'out_radius').length;
  const totalCheckedOut = employeeMapData.filter((e) => e.statusType === 'checked_out').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Peta Presensi GPS Check-In & Check-Out</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Radar Geofence Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visualisasi titik koordinat presensi masuk, pulang, dan radius zona kantor ({config.companyName}).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Map Controls & Engine Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Engine Selector */}
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
              onClick={() => setMapEngine('radar')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mapEngine === 'radar' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Radar Geofence</span>
            </button>
          </div>

          {/* Theme Selector (only if Radar Geofence is active) */}
          {mapEngine === 'radar' && (
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setMapTheme('dark')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  mapTheme === 'dark' ? 'bg-slate-950 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setMapTheme('blueprint')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  mapTheme === 'blueprint' ? 'bg-slate-950 text-blue-400 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Blueprint
              </button>
            </div>
          )}

          {/* Reset Zoom / Center Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Pusatkan Kembali ke Kantor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pusatkan</span>
          </button>
        </div>
      </div>

      {/* Stats Strip */}
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
          <div className="text-slate-500 font-semibold mb-0.5">Total Presensi di Peta</div>
          <div className="text-xl font-black text-slate-900">{totalCheckedIn}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hari Ini</div>
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
            <span>Di Dalam Kantor</span>
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
        {/* Map Canvas Column (Takes 2 Cols on large screen) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative flex flex-col">
          {/* Map Floating HUD Overlay */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
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
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-950 shrink-0" />
                <span>Check-In di Dalam Radius</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-950 shrink-0" />
                <span>Check-In di Luar Radius (WFA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-950 shrink-0" />
                <span>Sudah Check-Out</span>
              </div>
            </div>
          </div>

          {/* Floating Map Zoom Buttons */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-2xl">
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
            <button
              type="button"
              onClick={handleResetView}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              title="Kembalikan Sudut Pandang"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Scale indicator */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono text-slate-400">
            {mapEngine === 'radar' ? (
              <>Skala: {(100 / zoomLevel).toFixed(0)}m per grid • Zoom: {zoomLevel.toFixed(1)}x</>
            ) : (
              <>Google Maps Zoom: {googleZoom}x • {mapEngine === 'google-satellite' ? 'Satelit Hybrid' : 'Peta Google'}</>
            )}
          </div>

          {/* Map View Canvas: Google Maps vs Radar Geofence SVG */}
          {mapEngine !== 'radar' ? (
            <div className="w-full h-[450px] sm:h-[520px] relative bg-slate-950 overflow-hidden">
              <iframe
                title="Google Maps Presensi GPS"
                src={`https://maps.google.com/maps?q=${activeLat},${activeLng}&z=${googleZoom}&output=embed${mapEngine === 'google-satellite' ? '&t=k' : ''}`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />

              {/* Floating Google Maps Active Target Badge */}
              <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end max-w-[80%] sm:max-w-md">
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
                      href={`https://www.google.com/maps?q=${activeLat},${activeLng}`}
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
            <div className="w-full h-[450px] sm:h-[520px] relative select-none cursor-grab active:cursor-grabbing">
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
                {/* Radial gradient for Radar Geofence */}
                <radialGradient id="geofenceGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </radialGradient>

                {/* Grid pattern */}
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
                    stroke={
                      mapTheme === 'blueprint'
                        ? 'rgba(59, 130, 246, 0.12)'
                        : mapTheme === 'satellite'
                        ? 'rgba(20, 184, 166, 0.10)'
                        : 'rgba(255, 255, 255, 0.05)'
                    }
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              {/* Map Background */}
              <rect
                width={viewBoxWidth}
                height={viewBoxHeight}
                fill={
                  mapTheme === 'blueprint'
                    ? '#0c192e'
                    : mapTheme === 'satellite'
                    ? '#051919'
                    : '#090d16'
                }
              />

              {/* Grid Lines */}
              <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#mapGrid)" />

              {/* Concentric Distance Rings from Office */}
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
                      stroke={
                        isGeofence
                          ? '#10b981'
                          : mapTheme === 'blueprint'
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(148, 163, 184, 0.15)'
                      }
                      strokeWidth={isGeofence ? '2.5' : '1'}
                      strokeDasharray={isGeofence ? 'none' : '4 4'}
                    />
                    {/* Radius Distance Label */}
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

              {/* Animated Radar Sweep Ring around Geofence */}
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
                onClick={handleResetView}
              >
                {/* Office base pulse */}
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
                <text
                  x="0"
                  y="36"
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="8"
                  fontWeight="600"
                >
                  (Pusat Geofence)
                </text>
              </g>

              {/* Employee Pins */}
              {filteredMapData.map((item) => {
                const isSelected = selectedEmployeeId === item.employee.id;

                // Position coords
                const targetLat =
                  selectedRecordType === 'checkout' && item.checkOutLat
                    ? item.checkOutLat
                    : item.checkInLat || officeLat;
                const targetLng =
                  selectedRecordType === 'checkout' && item.checkOutLng
                    ? item.checkOutLng
                    : item.checkInLng || officeLng;

                const pos = coordsToSvg(targetLat, targetLng);

                // Pin color
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
                    onClick={() => {
                      setSelectedEmployeeId(item.employee.id);
                    }}
                  >
                    {/* Distance line from office if selected */}
                    {isSelected && (
                      <line
                        x1={-(pos.x - (centerX + panOffset.x))}
                        y1={-(pos.y - (centerY + panOffset.y))}
                        x2="0"
                        y2="0"
                        stroke={pinColor}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />
                    )}

                    {/* Selected pulse halo */}
                    {isSelected && (
                      <circle
                        r="24"
                        fill="none"
                        stroke={pinColor}
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}

                    {/* Pin Outer Ring */}
                    <circle
                      r={isSelected ? '16' : '13'}
                      fill="#0f172a"
                      stroke={pinColor}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="shadow-xl"
                    />

                    {/* Employee Initials */}
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

                    {/* Small Status Indicator Dot */}
                    <circle
                      cx="9"
                      cy="-9"
                      r="4"
                      fill={pinColor}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />

                    {/* Employee Label Tag */}
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
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {selectedItem.employee.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{selectedItem.employee.name}</h3>
                    <div className="text-xs text-slate-500">
                      {selectedItem.employee.department} • {selectedItem.employee.position}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold"
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
                      ? 'Sudah Check-Out'
                      : selectedItem.statusType === 'out_radius'
                      ? 'Check-In Luar Radius (WFA)'
                      : 'Check-In Valid di Kantor'}
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
                    <span>Buka Titik di Google Maps</span>
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
              <div className="text-xs font-bold text-slate-800">Pilih Pin di Peta</div>
              <p className="text-[11px] text-slate-500">
                Klik pin karyawan di atas kanvas peta atau pilih dari daftar di bawah untuk melihat rincian koordinat GPS dan rute.
              </p>
            </div>
          )}

          {/* Attendee Quick List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex-1 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Daftar Karyawan di Peta ({filteredMapData.length})</span>
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
                      onClick={() => {
                        setSelectedEmployeeId(item.employee.id);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs transition cursor-pointer flex items-center justify-between gap-2 border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${pinColor} shrink-0`} />
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
