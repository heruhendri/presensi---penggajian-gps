import { formatDistance } from './geo';

export interface GpsWatermarkData {
  lat: number;
  lng: number;
  accuracy: number;
  distanceToOffice: number;
  officeRadius: number;
  employeeName: string;
  employeeId: string;
  department: string;
  companyName: string;
  appName?: string;
  timestamp?: Date;
  statusLabel?: string;
  note?: string;
}

/**
 * Draws a professional, high-contrast GPS and employee identity watermark
 * directly onto an HTML canvas and returns a high-resolution JPEG Data URL.
 */
export function drawGpsWatermark(
  source: HTMLImageElement | HTMLVideoElement,
  data: GpsWatermarkData
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia');
  }

  // Determine source dimensions
  let srcWidth = 0;
  let srcHeight = 0;
  if (source instanceof HTMLVideoElement) {
    srcWidth = source.videoWidth || 640;
    srcHeight = source.videoHeight || 480;
  } else {
    srcWidth = source.naturalWidth || source.width || 640;
    srcHeight = source.naturalHeight || source.height || 480;
  }

  // Set maximum canvas width for crispness and performance
  const maxDim = 1200;
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;
  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  // Ensure minimum reasonable dimensions for watermark clarity
  targetWidth = Math.max(targetWidth, 640);
  targetHeight = Math.max(targetHeight, 480);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // 1. Draw source image
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  // 2. Prepare timestamp formatting
  const now = data.timestamp || new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayStr = dayNames[now.getDay()];
  const dateStr = `${dayStr}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

  // Scale fonts relative to canvas dimensions
  const scale = Math.max(0.75, targetWidth / 900);
  const pad = Math.round(18 * scale);

  // 3. Top-Right Corner HUD Badge
  const topBadgeWidth = Math.round(230 * scale);
  const topBadgeHeight = Math.round(44 * scale);
  const topX = targetWidth - topBadgeWidth - pad;
  const topY = pad;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
  ctx.lineWidth = 1.5 * scale;
  drawRoundedRect(ctx, topX, topY, topBadgeWidth, topBadgeHeight, 8 * scale);
  ctx.fill();
  ctx.stroke();

  // Pulsing dot simulation
  ctx.fillStyle = '#10b981'; // Emerald
  ctx.beginPath();
  ctx.arc(topX + 16 * scale, topY + topBadgeHeight / 2, 5 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
  ctx.fillText('LIVE GPS GEO-TAGGED', topX + 28 * scale, topY + 18 * scale);

  ctx.fillStyle = '#34d399';
  ctx.font = `${Math.round(10 * scale)}px monospace`;
  ctx.fillText(
    `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
    topX + 28 * scale,
    topY + 34 * scale
  );
  ctx.restore();

  // 4. Bottom Watermark Banner
  const bannerHeight = Math.round(175 * scale);
  const bannerY = targetHeight - bannerHeight - pad;
  const bannerX = pad;
  const bannerWidth = targetWidth - pad * 2;

  ctx.save();
  // Semi-transparent frosted dark backdrop
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.lineWidth = 1.5 * scale;
  drawRoundedRect(ctx, bannerX, bannerY, bannerWidth, bannerHeight, 14 * scale);
  ctx.fill();
  ctx.stroke();

  // Top accent line on banner
  ctx.fillStyle = '#10b981';
  ctx.fillRect(bannerX + 14 * scale, bannerY, bannerWidth - 28 * scale, 3 * scale);

  let curY = bannerY + 26 * scale;
  const textX = bannerX + 18 * scale;

  // Line 1: Header Brand & Status
  ctx.fillStyle = '#10b981';
  ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
  ctx.fillText('● BUKTI VERIFIKASI PRESENSI GPS RESMI', textX, curY);

  const brandText = `${data.appName || data.companyName}`;
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.round(11 * scale)}px sans-serif`;
  const brandWidth = ctx.measureText(brandText).width;
  ctx.fillText(brandText, bannerX + bannerWidth - brandWidth - 18 * scale, curY);

  // Line 2: Employee Name, ID, Department
  curY += 28 * scale;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(15 * scale)}px sans-serif`;
  ctx.fillText(`${data.employeeName}`, textX, curY);

  const idText = `NIP: ${data.employeeId}  |  Divisi: ${data.department}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `${Math.round(12 * scale)}px sans-serif`;
  ctx.fillText(idText, textX + ctx.measureText(`${data.employeeName}   `).width, curY);

  // Line 3: Exact Lat / Lng Coordinates with high contrast
  curY += 26 * scale;
  ctx.fillStyle = '#38bdf8'; // Sky blue for GPS
  ctx.font = `bold ${Math.round(13 * scale)}px monospace`;
  const coordText = `📍 KOORDINAT : LAT ${data.lat >= 0 ? '+' : ''}${data.lat.toFixed(6)}  •  LNG ${data.lng >= 0 ? '+' : ''}${data.lng.toFixed(6)}`;
  ctx.fillText(coordText, textX, curY);

  // Line 4: Office distance, radius, and accuracy
  curY += 24 * scale;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `${Math.round(12 * scale)}px sans-serif`;
  const distText = `🎯 Jarak ke Kantor: ${formatDistance(data.distanceToOffice)} (Radius Maks: ${data.officeRadius}m)  •  Akurasi GPS: ±${Math.round(data.accuracy)}m`;
  ctx.fillText(distText, textX, curY);

  // Line 5: Date and Time stamp + Security seal
  curY += 24 * scale;
  ctx.fillStyle = '#fde047'; // Soft yellow for timestamp
  ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
  ctx.fillText(`🕒 ${dateStr} - ${timeStr}`, textX, curY);

  const sealText = `STATUS: ${data.statusLabel || 'TERVERIFIKASI SISTEM'}`;
  ctx.fillStyle = '#34d399';
  ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
  const sealWidth = ctx.measureText(sealText).width;
  ctx.fillText(sealText, bannerX + bannerWidth - sealWidth - 18 * scale, curY);

  ctx.restore();

  // Export as high quality JPEG
  return canvas.toDataURL('image/jpeg', 0.92);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
