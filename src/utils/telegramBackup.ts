import { SystemBackupData, CompanyConfig, Employee, Shift, AttendanceRecord, WorkReport, TemporaryLocationAssignment, PushNotification, EmailLog } from '../types';

/**
 * Utility to test Telegram Bot API connection using getMe
 */
export async function testTelegramBotConnection(botToken: string): Promise<{
  success: boolean;
  botName?: string;
  username?: string;
  error?: string;
}> {
  if (!botToken || !botToken.trim()) {
    return { success: false, error: 'Token bot Telegram tidak boleh kosong.' };
  }

  const cleanToken = botToken.trim();
  const url = `https://api.telegram.org/bot${cleanToken}/getMe`;

  try {
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();

    if (data.ok && data.result) {
      return {
        success: true,
        botName: data.result.first_name,
        username: data.result.username,
      };
    } else {
      return {
        success: false,
        error: data.description || 'Token bot Telegram tidak valid atau tidak ditemukan.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal terhubung ke server Telegram API. Periksa koneksi internet Anda.',
    };
  }
}

/**
 * Formats standard date readable in Indonesian
 */
export function formatIndonesianDateTime(date: Date = new Date()): string {
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';
}

/**
 * Builds the full system snapshot object
 */
export function generateSystemBackupData(params: {
  config: CompanyConfig;
  employees: Employee[];
  shifts: Shift[];
  attendanceRecords: AttendanceRecord[];
  workReports?: WorkReport[];
  assignments?: TemporaryLocationAssignment[];
  notifications?: PushNotification[];
  emailLogs?: EmailLog[];
}): SystemBackupData {
  const now = new Date();
  const readable = formatIndonesianDateTime(now);
  const workReports = params.workReports || [];
  const assignments = params.assignments || [];
  const notifications = params.notifications || [];
  const emailLogs = params.emailLogs || [];

  return {
    version: '3.5.0-enterprise',
    exportedAt: now.toISOString(),
    exportTimestampReadable: readable,
    timestamp: readable,
    systemName: 'Presensi & Penggajian GPS',
    companyName: params.config.companyName || 'Perusahaan',
    appName: params.config.appName || 'Presensi & Penggajian GPS',
    summary: {
      totalEmployees: params.employees.length,
      totalAttendances: params.attendanceRecords.length,
      totalWorkReports: workReports.length,
      totalAssignments: assignments.length,
      totalShifts: params.shifts.length,
      totalNotifications: notifications.length,
    },
    config: params.config,
    employees: params.employees,
    shifts: params.shifts,
    attendanceRecords: params.attendanceRecords,
    workReports,
    assignments,
    notifications,
    emailLogs,
  };
}

/**
 * Sends the backup JSON document directly to the designated Telegram Bot Chat
 * Supports calling either with:
 * 1) (config: CompanyConfig, backupData: SystemBackupData, options?: {...})
 * 2) (botToken: string, chatId: string, backupData: SystemBackupData, options?: {...})
 */
export async function sendTelegramBackupDocument(
  configOrToken: CompanyConfig | string,
  backupDataOrChatId: SystemBackupData | string,
  backupDataOrOptions?: SystemBackupData | { topicId?: string; isDailyAutomated?: boolean },
  maybeOptions?: { topicId?: string; isDailyAutomated?: boolean }
): Promise<{ success: boolean; message: string; timestamp: string; error?: string }> {
  let botToken = '';
  let chatId = '';
  let backupData: SystemBackupData;
  let options: { topicId?: string; isDailyAutomated?: boolean } | undefined;

  if (typeof configOrToken === 'object') {
    // Called as (config, backupData, options)
    botToken = configOrToken.telegramBotToken || '';
    chatId = configOrToken.telegramChatId || '';
    backupData = backupDataOrChatId as SystemBackupData;
    options = backupDataOrOptions as { topicId?: string; isDailyAutomated?: boolean } | undefined;
    if (!options?.topicId && configOrToken.telegramTopicId) {
      options = { ...options, topicId: configOrToken.telegramTopicId };
    }
  } else {
    // Called as (botToken, chatId, backupData, options)
    botToken = configOrToken;
    chatId = backupDataOrChatId as string;
    backupData = backupDataOrOptions as SystemBackupData;
    options = maybeOptions;
  }

  const cleanToken = botToken?.trim();
  const cleanChatId = chatId?.trim();
  const nowStr = formatIndonesianDateTime(new Date());

  if (!cleanToken || !cleanChatId) {
    const errMsg = 'Token Bot Telegram dan Chat ID wajib diisi pada pengaturan.';
    return {
      success: false,
      message: errMsg,
      error: errMsg,
      timestamp: nowStr,
    };
  }

  try {
    const jsonString = JSON.stringify(backupData, null, 2);
    const dateFileStr = new Date().toISOString().slice(0, 10);
    const timeFileStr = new Date().toTimeString().slice(0, 5).replace(':', '');
    const filename = `backup_presensi_${dateFileStr}_${timeFileStr}.json`;

    const blob = new Blob([jsonString], { type: 'application/json' });

    const caption = [
      options?.isDailyAutomated ? '🤖 <b>CADANGAN HARIAN OTOMATIS (DAILY BACKUP)</b>' : '📦 <b>CADANGAN DATA SISTEM (MANUAL BACKUP)</b>',
      `🏢 <b>Perusahaan:</b> ${backupData.companyName}`,
      `📱 <b>Aplikasi:</b> ${backupData.appName || 'Presensi & Payroll GPS'}`,
      `📅 <b>Waktu Eksekusi:</b> ${backupData.exportTimestampReadable}`,
      '',
      '📊 <b>Ringkasan Database:</b>',
      `• Total Karyawan: <b>${backupData.summary.totalEmployees}</b> orang`,
      `• Log Presensi GPS: <b>${backupData.summary.totalAttendances}</b> rekaman`,
      `• Laporan Kerja: <b>${backupData.summary.totalWorkReports}</b> laporan`,
      `• Penugasan Luar Kota: <b>${backupData.summary.totalAssignments}</b> tugas aktif`,
      `• Master Shift: <b>${backupData.summary.totalShifts}</b> shift`,
      '',
      '💾 <i>File snapshot terlampir (.json) dapat langsung dipulihkan (Restore) kapan saja melalui panel admin.</i>',
      '🔒 <i>Sistem Presensi & Penggajian GPS • Dibuat oleh heruhendri</i>',
    ].join('\n');

    const formData = new FormData();
    formData.append('chat_id', cleanChatId);
    if (options?.topicId && options.topicId.trim()) {
      formData.append('message_thread_id', options.topicId.trim());
    }
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('document', blob, filename);

    const endpoint = `https://api.telegram.org/bot${cleanToken}/sendDocument`;

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const resData = await res.json();

    if (resData.ok) {
      return {
        success: true,
        message: `Backup data (${filename}) berhasil dikirimkan ke Telegram chat ID: ${cleanChatId}!`,
        timestamp: nowStr,
      };
    } else {
      // If sendDocument fails (e.g. strict format or bot permissions), try fallback with sendMessage
      const fallbackUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
      const textMessage = `${caption}\n\n⚠️ <i>Catatan: Lampiran file tidak dapat diunggah (${resData.description || 'error'}), ringkasan teks berhasil dikirim.</i>`;

      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          message_thread_id: options?.topicId ? options.topicId.trim() : undefined,
          text: textMessage,
          parse_mode: 'HTML',
        }),
      });

      const fallbackData = await fallbackRes.json();
      if (fallbackData.ok) {
        return {
          success: true,
          message: `Ringkasan backup terkirim via pesan teks Telegram (unggah file: ${resData.description}).`,
          timestamp: nowStr,
        };
      }

      const errMsg = `Gagal mengirim ke Telegram: ${resData.description || 'Respons error Telegram.'}`;
      return {
        success: false,
        message: errMsg,
        error: errMsg,
        timestamp: nowStr,
      };
    }
  } catch (err: any) {
    const errMsg = `Gagal mengirim backup ke Telegram: ${err.message || 'Koneksi jaringan terputus.'}`;
    return {
      success: false,
      message: errMsg,
      error: errMsg,
      timestamp: nowStr,
    };
  }
}

/**
 * Downloads backup data as a JSON file to user's computer/phone
 */
export function downloadBackupJsonFile(backupData: SystemBackupData) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
  const filename = `backup-presensi-gps-${dateStr}-${timeStr}.json`;

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses uploaded backup JSON file
 */
export function validateAndParseBackupContent(fileText: string): {
  valid: boolean;
  data?: SystemBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(fileText);

    // Basic structure checking
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File bukan objek JSON yang valid.' };
    }

    if (!Array.isArray(parsed.employees) && !Array.isArray(parsed.attendanceRecords) && !parsed.config) {
      return {
        valid: false,
        error: 'Format data backup tidak sesuai. File harus memuat data karyawan, presensi, atau konfigurasi.',
      };
    }

    const data: SystemBackupData = {
      version: parsed.version || 'unknown',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      exportTimestampReadable: parsed.exportTimestampReadable || 'Waktu tidak diketahui',
      systemName: parsed.systemName || 'Sistem Presensi GPS',
      companyName: parsed.companyName || parsed.config?.companyName || 'Perusahaan',
      appName: parsed.appName || parsed.config?.appName,
      summary: {
        totalEmployees: Array.isArray(parsed.employees) ? parsed.employees.length : 0,
        totalAttendances: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords.length : 0,
        totalWorkReports: Array.isArray(parsed.workReports) ? parsed.workReports.length : 0,
        totalAssignments: Array.isArray(parsed.assignments) ? parsed.assignments.length : 0,
        totalShifts: Array.isArray(parsed.shifts) ? parsed.shifts.length : 0,
        totalNotifications: Array.isArray(parsed.notifications) ? parsed.notifications.length : 0,
      },
      config: parsed.config || {},
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
      attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : [],
      workReports: Array.isArray(parsed.workReports) ? parsed.workReports : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : [],
    };

    return { valid: true, data };
  } catch (err: any) {
    return { valid: false, error: `Gagal membaca file JSON: ${err.message}` };
  }
}
