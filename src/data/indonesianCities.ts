export interface CityLocation {
  name: string;
  province: string;
  lat: number;
  lng: number;
  isCustom?: boolean;
}

export const DEFAULT_INDONESIAN_CITIES: CityLocation[] = [
  // Pulau Jawa
  { name: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.1818, lng: 106.8223 },
  { name: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.2615, lng: 106.8106 },
  { name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lng: 112.7521 },
  { name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
  { name: 'Semarang', province: 'Jawa Tengah', lat: -6.9667, lng: 110.4167 },
  { name: 'Yogyakarta', province: 'D.I. Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Surakarta (Solo)', province: 'Jawa Tengah', lat: -7.5666, lng: 110.8290 },
  { name: 'Malang', province: 'Jawa Timur', lat: -7.9839, lng: 112.6214 },
  { name: 'Sidoarjo', province: 'Jawa Timur', lat: -7.4478, lng: 112.7183 },
  { name: 'Gresik', province: 'Jawa Timur', lat: -7.1566, lng: 112.6555 },
  { name: 'Banyuwangi', province: 'Jawa Timur', lat: -8.2192, lng: 114.3691 },
  { name: 'Jember', province: 'Jawa Timur', lat: -8.1724, lng: 113.7007 },
  { name: 'Kediri', province: 'Jawa Timur', lat: -7.8480, lng: 112.0178 },
  { name: 'Madiun', province: 'Jawa Timur', lat: -7.6298, lng: 111.5239 },
  { name: 'Cirebon', province: 'Jawa Barat', lat: -6.7320, lng: 108.5523 },
  { name: 'Bekasi', province: 'Jawa Barat', lat: -6.2383, lng: 106.9756 },
  { name: 'Bogor', province: 'Jawa Barat', lat: -6.5971, lng: 106.8060 },
  { name: 'Depok', province: 'Jawa Barat', lat: -6.4025, lng: 106.7942 },
  { name: 'Tangerang', province: 'Banten', lat: -6.1783, lng: 106.6319 },
  { name: 'Tangerang Selatan', province: 'Banten', lat: -6.2838, lng: 106.7118 },
  { name: 'Cilegon', province: 'Banten', lat: -6.0024, lng: 106.0505 },
  { name: 'Serang', province: 'Banten', lat: -6.1104, lng: 106.1640 },
  { name: 'Purwokerto', province: 'Jawa Tengah', lat: -7.4243, lng: 109.2302 },
  { name: 'Cilacap', province: 'Jawa Tengah', lat: -7.7032, lng: 109.0159 },
  { name: 'Tegal', province: 'Jawa Tengah', lat: -6.8694, lng: 109.1402 },
  { name: 'Pekalongan', province: 'Jawa Tengah', lat: -6.8886, lng: 109.6753 },

  // Pulau Bali & Nusa Tenggara
  { name: 'Denpasar', province: 'Bali', lat: -8.6705, lng: 115.2126 },
  { name: 'Badung (Kuta)', province: 'Bali', lat: -8.7185, lng: 115.1686 },
  { name: 'Mataram (Lombok)', province: 'Nusa Tenggara Barat', lat: -8.5833, lng: 116.1167 },
  { name: 'Labuan Bajo', province: 'Nusa Tenggara Timur', lat: -8.4964, lng: 119.8877 },
  { name: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.1772, lng: 123.6070 },

  // Pulau Sumatera
  { name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lng: 98.6722 },
  { name: 'Batam', province: 'Kepulauan Riau', lat: 1.1301, lng: 104.0530 },
  { name: 'Tanjung Pinang', province: 'Kepulauan Riau', lat: 0.9167, lng: 104.4500 },
  { name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754 },
  { name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lng: 101.4478 },
  { name: 'Padang', province: 'Sumatera Barat', lat: -0.9471, lng: 100.4172 },
  { name: 'Bandar Lampung', province: 'Lampung', lat: -5.4294, lng: 105.2625 },
  { name: 'Jambi', province: 'Jambi', lat: -1.6101, lng: 103.6131 },
  { name: 'Bengkulu', province: 'Bengkulu', lat: -3.8004, lng: 102.2655 },
  { name: 'Pangkal Pinang', province: 'Kep. Bangka Belitung', lat: -2.1333, lng: 106.1167 },
  { name: 'Banda Aceh', province: 'Aceh', lat: 5.5483, lng: 95.3238 },

  // Pulau Kalimantan
  { name: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.2379, lng: 116.8529 },
  { name: 'Samarinda', province: 'Kalimantan Timur', lat: -0.5022, lng: 117.1537 },
  { name: 'Nusantara (IKN)', province: 'Kalimantan Timur', lat: -0.9744, lng: 116.7088 },
  { name: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3194, lng: 114.5908 },
  { name: 'Banjarbaru', province: 'Kalimantan Selatan', lat: -3.4402, lng: 114.8306 },
  { name: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lng: 109.3425 },
  { name: 'Palangka Raya', province: 'Kalimantan Tengah', lat: -2.2161, lng: 113.9139 },
  { name: 'Tarakan', province: 'Kalimantan Utara', lat: 3.3270, lng: 117.5960 },

  // Pulau Sulawesi
  { name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327 },
  { name: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lng: 124.8421 },
  { name: 'Palu', province: 'Sulawesi Tengah', lat: -0.9003, lng: 119.8779 },
  { name: 'Morowali', province: 'Sulawesi Tengah', lat: -2.6500, lng: 121.9000 },
  { name: 'Kendari', province: 'Sulawesi Tenggara', lat: -3.9985, lng: 122.5126 },
  { name: 'Gorontalo', province: 'Gorontalo', lat: 0.5435, lng: 123.0568 },
  { name: 'Mamuju', province: 'Sulawesi Barat', lat: -2.6770, lng: 118.8870 },

  // Kepulauan Maluku & Papua
  { name: 'Ambon', province: 'Maluku', lat: -3.6954, lng: 128.1814 },
  { name: 'Ternate', province: 'Maluku Utara', lat: 0.7900, lng: 127.3800 },
  { name: 'Jayapura', province: 'Papua', lat: -2.5337, lng: 140.7181 },
  { name: 'Sorong', province: 'Papua Barat Daya', lat: -0.8762, lng: 131.2558 },
  { name: 'Manokwari', province: 'Papua Barat', lat: -0.8615, lng: 134.0620 },
  { name: 'Timika', province: 'Papua Tengah', lat: -4.5441, lng: 136.8837 },
  { name: 'Merauke', province: 'Papua Selatan', lat: -8.4991, lng: 140.4011 },
];

const STORAGE_KEY = 'hr_custom_duty_cities_v1';

export function getStoredCities(): CityLocation[] {
  if (typeof window === 'undefined') return DEFAULT_INDONESIAN_CITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INDONESIAN_CITIES;
    const customList: CityLocation[] = JSON.parse(raw);
    if (!Array.isArray(customList)) return DEFAULT_INDONESIAN_CITIES;

    // Filter duplicates by name
    const customNames = new Set(customList.map((c) => c.name.toLowerCase()));
    const baseWithoutDuplicates = DEFAULT_INDONESIAN_CITIES.filter(
      (c) => !customNames.has(c.name.toLowerCase())
    );

    return [...customList.map((c) => ({ ...c, isCustom: true })), ...baseWithoutDuplicates];
  } catch (err) {
    console.error('Failed to parse custom duty cities from storage:', err);
    return DEFAULT_INDONESIAN_CITIES;
  }
}

export function saveCustomCity(newCity: {
  name: string;
  province: string;
  lat: number;
  lng: number;
}): CityLocation[] {
  if (typeof window === 'undefined') return DEFAULT_INDONESIAN_CITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: CityLocation[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Remove if existing city with same name
    list = list.filter((c) => c.name.toLowerCase() !== newCity.name.trim().toLowerCase());
    
    const item: CityLocation = {
      name: newCity.name.trim(),
      province: newCity.province.trim() || 'Lainnya',
      lat: Number(newCity.lat),
      lng: Number(newCity.lng),
      isCustom: true,
    };

    list.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return getStoredCities();
  } catch (err) {
    console.error('Failed to save custom city:', err);
    return getStoredCities();
  }
}

export function deleteCustomCity(cityName: string): CityLocation[] {
  if (typeof window === 'undefined') return DEFAULT_INDONESIAN_CITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INDONESIAN_CITIES;
    let list: CityLocation[] = JSON.parse(raw);
    if (!Array.isArray(list)) return DEFAULT_INDONESIAN_CITIES;

    list = list.filter((c) => c.name.toLowerCase() !== cityName.trim().toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return getStoredCities();
  } catch (err) {
    console.error('Failed to delete custom city:', err);
    return getStoredCities();
  }
}

export function findCityCoordinates(query: string): CityLocation | undefined {
  if (!query || !query.trim()) return undefined;
  const q = query.trim().toLowerCase();
  const allCities = getStoredCities();

  // 1. Exact match
  const exact = allCities.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;

  // 2. Starts with match
  const startsWith = allCities.find((c) => c.name.toLowerCase().startsWith(q));
  if (startsWith) return startsWith;

  // 3. Includes match
  const included = allCities.find((c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()));
  return included;
}
