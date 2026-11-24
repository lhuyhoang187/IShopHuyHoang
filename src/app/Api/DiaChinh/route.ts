import { NextRequest, NextResponse } from 'next/server';

export interface LocationItem {
  code: string;
  name: string;
}

// Server-side in-memory cache so repeated lookups are instantaneous
const cache = new Map<string, { data: LocationItem[]; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getCached(key: string): LocationItem[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: LocationItem[]) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchProvinces(): Promise<LocationItem[]> {
  const cached = getCached('provinces');
  if (cached) return cached;

  try {
    const res = await fetch('https://provinces.open-api.vn/api/v1/?depth=1', {
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        const items: LocationItem[] = json.map((p: any) => ({
          code: String(p.code),
          name: String(p.name),
        }));
        setCached('provinces', items);
        return items;
      }
    }
  } catch (err) {
    console.warn('provinces.open-api.vn failed, trying esgoo fallback:', err);
  }

  // Backup API: esgoo.net
  const res2 = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm', {
    signal: AbortSignal.timeout(6000),
    cache: 'no-store',
  });
  const json2 = await res2.json();
  if (json2?.error === 0 && Array.isArray(json2.data)) {
    const items: LocationItem[] = json2.data.map((p: any) => ({
      code: String(p.id),
      name: String(p.full_name || p.name),
    }));
    setCached('provinces', items);
    return items;
  }

  return [];
}

async function fetchDistricts(provinceCode: string): Promise<LocationItem[]> {
  const key = `districts_${provinceCode}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://provinces.open-api.vn/api/v1/p/${encodeURIComponent(provinceCode)}?depth=2`,
      {
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.districts)) {
        const items: LocationItem[] = json.districts.map((d: any) => ({
          code: String(d.code),
          name: String(d.name),
        }));
        setCached(key, items);
        return items;
      }
    }
  } catch (err) {
    console.warn('provinces.open-api.vn districts failed, trying esgoo fallback:', err);
  }

  const padded = provinceCode.padStart(2, '0');
  const res2 = await fetch(`https://esgoo.net/api-tinhthanh/2/${encodeURIComponent(padded)}.htm`, {
    signal: AbortSignal.timeout(6000),
    cache: 'no-store',
  });
  const json2 = await res2.json();
  if (json2?.error === 0 && Array.isArray(json2.data)) {
    const items: LocationItem[] = json2.data.map((d: any) => ({
      code: String(d.id),
      name: String(d.full_name || d.name),
    }));
    setCached(key, items);
    return items;
  }

  return [];
}

async function fetchWards(districtCode: string): Promise<LocationItem[]> {
  const key = `wards_${districtCode}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://provinces.open-api.vn/api/v1/d/${encodeURIComponent(districtCode)}?depth=2`,
      {
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.wards)) {
        const items: LocationItem[] = json.wards.map((w: any) => ({
          code: String(w.code),
          name: String(w.name),
        }));
        setCached(key, items);
        return items;
      }
    }
  } catch (err) {
    console.warn('provinces.open-api.vn wards failed, trying esgoo fallback:', err);
  }

  const padded = districtCode.padStart(3, '0');
  const res2 = await fetch(`https://esgoo.net/api-tinhthanh/3/${encodeURIComponent(padded)}.htm`, {
    signal: AbortSignal.timeout(6000),
    cache: 'no-store',
  });
  const json2 = await res2.json();
  if (json2?.error === 0 && Array.isArray(json2.data)) {
    const items: LocationItem[] = json2.data.map((w: any) => ({
      code: String(w.id),
      name: String(w.full_name || w.name),
    }));
    setCached(key, items);
    return items;
  }

  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'provinces';
    const provinceCode = searchParams.get('provinceCode') || '';
    const districtCode = searchParams.get('districtCode') || '';

    if (type === 'provinces') {
      const data = await fetchProvinces();
      return NextResponse.json({ success: true, data });
    }

    if (type === 'districts') {
      if (!provinceCode) {
        return NextResponse.json({ success: true, data: [] });
      }
      const data = await fetchDistricts(provinceCode);
      return NextResponse.json({ success: true, data });
    }

    if (type === 'wards') {
      if (!districtCode) {
        return NextResponse.json({ success: true, data: [] });
      }
      const data = await fetchWards(districtCode);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid location type' }, { status: 400 });
  } catch (error: any) {
    console.error('Locations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách địa chỉ hành chính: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
