'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, ChevronDown, Search, Check, Loader2, X, Home } from 'lucide-react';

export interface LocationOption {
  code: string;
  name: string;
}

export interface AddressPickerValue {
  city: string;
  district: string;
  ward: string;
  street: string;
  fullAddress: string;
}

interface Props {
  initialCity?: string;
  initialAddress?: string;
  onChange: (val: AddressPickerValue) => void;
}

function normalizeText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function matchesLocation(optionName: string, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const target = normalizeText(optionName);
  if (target.includes(q)) return true;

  // Common Vietnamese city abbreviations
  if ((q === 'hcm' || q === 'tphcm' || q === 'sg' || q === 'sai gon') && target.includes('ho chi minh')) {
    return true;
  }
  if (q === 'hn' && target.includes('ha noi')) return true;
  if (q === 'dn' && target.includes('da nang')) return true;
  if (q === 'hp' && target.includes('hai phong')) return true;
  if (q === 'ct' && target.includes('can tho')) return true;

  // Match initials (e.g. "q1" -> "quan 1", "p12" -> "phuong 12")
  const compactTarget = target
    .replace(/^thanh pho\s+/, '')
    .replace(/^tinh\s+/, '')
    .replace(/^quan\s+/, 'q')
    .replace(/^phuong\s+/, 'p')
    .replace(/^huyen\s+/, 'h')
    .replace(/^xa\s+/, 'x')
    .replace(/\s+/g, '');
  const compactQuery = q.replace(/\s+/g, '');
  if (compactTarget.includes(compactQuery)) return true;

  return false;
}

interface SearchableSelectProps {
  label: string;
  options: LocationOption[];
  selected: LocationOption | null;
  onSelect: (option: LocationOption | null) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyText?: string;
  searchPlaceholder?: string;
}

function SearchableLocationSelect({
  label,
  options,
  selected,
  onSelect,
  disabled = false,
  loading = false,
  emptyText = 'Không tìm thấy kết quả phù hợp',
  searchPlaceholder = 'Gõ để lọc nhanh...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((o) => matchesLocation(o.name, search));
  }, [options, search]);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-slate-700 font-semibold mb-1 block">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all text-xs ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-amber-500 ring-2 ring-amber-500/15 text-slate-900 cursor-pointer'
            : 'bg-slate-50 border-slate-300 hover:border-amber-400 hover:bg-white text-slate-900 cursor-pointer shadow-inner'
        }`}
      >
        <span className={`truncate ${selected ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
          {loading ? 'Đang tải danh sách...' : selected ? selected.name : `Chọn ${label.replace(':', '').replace('*', '').trim()}`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          ) : (
            <>
              {selected && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(null);
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                  title="Xóa lựa chọn"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-amber-600' : ''}`}
              />
            </>
          )}
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="py-5 text-center text-[11px] text-slate-400">{emptyText}</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected?.code === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function VietnamAddressPicker({ initialCity = '', initialAddress = '', onChange }: Props) {
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<LocationOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationOption | null>(null);
  const [selectedWard, setSelectedWard] = useState<LocationOption | null>(null);
  const [street, setStreet] = useState('');

  const hydratedRef = useRef(false);
  const parsedPartsRef = useRef<{ street: string; ward: string; district: string; province: string }>({
    street: '',
    ward: '',
    district: '',
    province: '',
  });

  // Parse existing full address into parts once when initial props arrive
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!initialCity && !initialAddress) return;

    const parts = (initialAddress || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length >= 4) {
      parsedPartsRef.current = {
        street: parts.slice(0, parts.length - 3).join(', '),
        ward: parts[parts.length - 3],
        district: parts[parts.length - 2],
        province: parts[parts.length - 1] || initialCity,
      };
    } else if (parts.length === 3) {
      parsedPartsRef.current = {
        street: parts[0],
        ward: '',
        district: parts[1],
        province: parts[2] || initialCity,
      };
    } else {
      parsedPartsRef.current = {
        street: initialAddress || '',
        ward: '',
        district: '',
        province: initialCity || '',
      };
    }
    setStreet(parsedPartsRef.current.street);
  }, [initialCity, initialAddress]);

  // 1. Load Provinces from API
  useEffect(() => {
    let active = true;
    setLoadingProvinces(true);
    fetch('/api/locations?type=provinces')
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json?.success && Array.isArray(json.data)) {
          setProvinces(json.data);
        }
      })
      .catch((e) => console.warn('Load provinces error:', e))
      .finally(() => {
        if (active) setLoadingProvinces(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Match initial province once provinces load
  useEffect(() => {
    if (hydratedRef.current || provinces.length === 0) return;
    const targetProv = parsedPartsRef.current.province || initialCity;
    if (!targetProv) return;

    const normTarget = normalizeText(targetProv).replace(/^tp\.?\s*/, 'thanh pho ');
    const matched = provinces.find((p) => {
      const normName = normalizeText(p.name);
      return (
        normName === normTarget ||
        normName.includes(normTarget) ||
        normTarget.includes(normName.replace(/^thanh pho\s+/, '').replace(/^tinh\s+/, ''))
      );
    });
    if (matched) {
      setSelectedProvince(matched);
    }
  }, [provinces, initialCity]);

  // 2. Load Districts when Province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      return;
    }

    let active = true;
    setLoadingDistricts(true);
    fetch(`/api/locations?type=districts&provinceCode=${encodeURIComponent(selectedProvince.code)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json?.success && Array.isArray(json.data)) {
          setDistricts(json.data);
          // Try matching initial district during hydration
          if (!hydratedRef.current && parsedPartsRef.current.district) {
            const targetDist = normalizeText(parsedPartsRef.current.district);
            const matchedDist = json.data.find((d: LocationOption) => {
              const normName = normalizeText(d.name);
              return normName === targetDist || normName.includes(targetDist) || targetDist.includes(normName);
            });
            if (matchedDist) {
              setSelectedDistrict(matchedDist);
            } else {
              hydratedRef.current = true;
            }
          }
        }
      })
      .catch((e) => console.warn('Load districts error:', e))
      .finally(() => {
        if (active) setLoadingDistricts(false);
      });
    return () => {
      active = false;
    };
  }, [selectedProvince]);

  // 3. Load Wards when District changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      return;
    }

    let active = true;
    setLoadingWards(true);
    fetch(`/api/locations?type=wards&districtCode=${encodeURIComponent(selectedDistrict.code)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json?.success && Array.isArray(json.data)) {
          setWards(json.data);
          if (!hydratedRef.current && parsedPartsRef.current.ward) {
            const targetWard = normalizeText(parsedPartsRef.current.ward);
            const matchedWard = json.data.find((w: LocationOption) => {
              const normName = normalizeText(w.name);
              return normName === targetWard || normName.includes(targetWard) || targetWard.includes(normName);
            });
            if (matchedWard) {
              setSelectedWard(matchedWard);
            }
            hydratedRef.current = true;
          }
        }
      })
      .catch((e) => console.warn('Load wards error:', e))
      .finally(() => {
        if (active) setLoadingWards(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDistrict]);

  // Emit composed address whenever any piece changes
  const emitChange = (
    nextProvince: LocationOption | null,
    nextDistrict: LocationOption | null,
    nextWard: LocationOption | null,
    nextStreet: string
  ) => {
    const cityName = nextProvince?.name || '';
    const distName = nextDistrict?.name || '';
    const wardName = nextWard?.name || '';
    const fullAddress = [nextStreet.trim(), wardName, distName, cityName].filter(Boolean).join(', ');
    onChange({
      city: cityName,
      district: distName,
      ward: wardName,
      street: nextStreet,
      fullAddress,
    });
  };

  const handleProvinceChange = (prov: LocationOption | null) => {
    hydratedRef.current = true;
    setSelectedProvince(prov);
    setSelectedDistrict(null);
    setSelectedWard(null);
    emitChange(prov, null, null, street);
  };

  const handleDistrictChange = (dist: LocationOption | null) => {
    hydratedRef.current = true;
    setSelectedDistrict(dist);
    setSelectedWard(null);
    emitChange(selectedProvince, dist, null, street);
  };

  const handleWardChange = (w: LocationOption | null) => {
    hydratedRef.current = true;
    setSelectedWard(w);
    emitChange(selectedProvince, selectedDistrict, w, street);
  };

  const handleStreetChange = (val: string) => {
    hydratedRef.current = true;
    setStreet(val);
    emitChange(selectedProvince, selectedDistrict, selectedWard, val);
  };

  const previewAddress = [
    street.trim(),
    selectedWard?.name,
    selectedDistrict?.name,
    selectedProvince?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchableLocationSelect
          label="Tỉnh / Thành Phố:"
          options={provinces}
          selected={selectedProvince}
          onSelect={handleProvinceChange}
          loading={loadingProvinces}
          searchPlaceholder="Nhập tên tỉnh/TP để lọc..."
        />

        <SearchableLocationSelect
          label="Quận / Huyện:"
          options={districts}
          selected={selectedDistrict}
          onSelect={handleDistrictChange}
          disabled={!selectedProvince}
          loading={loadingDistricts}
          searchPlaceholder="Nhập tên quận/huyện để lọc..."
        />

        <SearchableLocationSelect
          label="Phường / Xã:"
          options={wards}
          selected={selectedWard}
          onSelect={handleWardChange}
          disabled={!selectedDistrict}
          loading={loadingWards}
          searchPlaceholder="Nhập tên phường/xã để lọc..."
        />
      </div>

      <div>
        <label className="text-slate-700 font-semibold mb-1 block">Số Nhà, Tên Đường:</label>
        <div className="relative">
          <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoComplete="off"
            value={street}
            onChange={(e) => handleStreetChange(e.target.value)}
            placeholder="Nhập số nhà, tên đường"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
          />
        </div>
      </div>

      {previewAddress && (
        <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-xs text-slate-700">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Địa chỉ giao nhận đầy đủ: </span>
            <span>{previewAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
}
