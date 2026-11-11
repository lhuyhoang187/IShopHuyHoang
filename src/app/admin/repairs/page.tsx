'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Printer,
  QrCode,
  CheckCircle2,
  Clock,
  Cpu,
  User,
  X,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Activity,
  Zap,
  Download,
  Sliders,
  Trash2,
  Tag,
  Check,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Pencil,
  RotateCcw,
  LayoutGrid,
  List,
  Copy,
  Phone,
  Calendar,
  KeyRound,
  FileText,
  History,
  Eye,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import {
  RepairTicket,
  RepairStatus,
  SparePartItem,
  RepairDeviceOption,
  RepairServiceCatalogItem,
  RepairSymptomOption,
  RepairTimeSlotOption,
} from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportRepairsCsv } from '@/lib/exportUtils';

export default function AdminRepairsPage() {
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Config Modal State for Repair Booking Categories
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configTab, setConfigTab] = useState<'devices' | 'services' | 'symptoms' | 'timeSlots'>('devices');

  // Categories & options lists
  const [deviceList, setDeviceList] = useState<RepairDeviceOption[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<RepairServiceCatalogItem[]>([]);
  const [symptomList, setSymptomList] = useState<RepairSymptomOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<RepairTimeSlotOption[]>([]);

  // Add form states
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceBrand, setNewDeviceBrand] = useState('Apple');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(650000);
  const [newServiceWarranty, setNewServiceWarranty] = useState('12 Tháng');
  const [newServiceCategory, setNewServiceCategory] = useState('battery');
  const [newServiceMinutes, setNewServiceMinutes] = useState<number>(30);
  const [newServiceBrand, setNewServiceBrand] = useState('Apple');
  const [newServiceModels, setNewServiceModels] = useState('iPhone 15 Series');
  const [editingService, setEditingService] = useState<RepairServiceCatalogItem | null>(null);

  const [newSymptomTitle, setNewSymptomTitle] = useState('');
  const [newSymptomIcon, setNewSymptomIcon] = useState('📱');
  const [newSymptomDesc, setNewSymptomDesc] = useState('');

  const [newTimeSlotTime, setNewTimeSlotTime] = useState('09:00');
  const [newTimeSlotLabel, setNewTimeSlotLabel] = useState('09:00 - Sáng (Mở cửa)');
  const [newTimeSlotPeriod, setNewTimeSlotPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Helper dynamic initial delivery date (now + 2 hours)
  const getInitialDeliveryDate = () => {
    const d = new Date(Date.now() + 2 * 3600000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  // Intake Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deviceModel: 'iPhone 15 Pro Max',
    imeiOrSerial: '',
    unlockPasscode: '',
    appearanceCondition: 'Màn hình trầy nhẹ, thân máy nguyên bản',
    accessoriesIncluded: 'Không kèm phụ kiện, đã tháo SIM',
    issueDescription: 'Màn hình nứt vỡ kính, cần kiểm tra ép kính hoặc thay màn',
    laborFee: 150000,
    estimatedDeliveryDate: getInitialDeliveryDate(),
    technicianName: 'Trần Trọng Nghĩa',
    warrantyPeriod: 'Bảo hành 06 tháng',
  });

  // Action / Workbench Modal
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [stepNote, setStepNote] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);
  const [isEditingLaborFee, setIsEditingLaborFee] = useState(false);
  const [tempLaborFee, setTempLaborFee] = useState<number>(0);

  // Print Receipt Modal
  const [printTicket, setPrintTicket] = useState<RepairTicket | null>(null);

  const loadData = () => {
    setRepairs(IShopStore.getRepairs());
    setSpareParts(IShopStore.getSpareParts());
    setDeviceList(IShopStore.getRepairDeviceOptions());
    setServiceCatalog(IShopStore.getRepairServiceCatalog());
    setSymptomList(IShopStore.getRepairSymptomOptions());
    setTimeSlots(IShopStore.getRepairTimeSlotOptions());

    // Sync live from MySQL Database
    fetch('/api/repairs')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setRepairs(json.data);
        }
      })
      .catch((err) => console.warn('Repairs API notice:', err));

    // Sync config from API if available
    fetch('/api/repairs/config')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (Array.isArray(json.data.devices) && json.data.devices.length > 0) {
            setDeviceList(json.data.devices);
            IShopStore.setRepairDeviceOptions(json.data.devices);
          }
          if (Array.isArray(json.data.services) && json.data.services.length > 0) {
            setServiceCatalog(json.data.services);
            IShopStore.setRepairServiceCatalog(json.data.services);
          }
          if (Array.isArray(json.data.symptoms) && json.data.symptoms.length > 0) {
            setSymptomList(json.data.symptoms);
            IShopStore.setRepairSymptomOptions(json.data.symptoms);
          }
          if (Array.isArray(json.data.timeSlots) && json.data.timeSlots.length > 0) {
            setTimeSlots(json.data.timeSlots);
            IShopStore.setRepairTimeSlotOptions(json.data.timeSlots);
          }
        }
      })
      .catch((err) => console.warn('Config fetch notice:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Category Management Handlers
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    const newDev: RepairDeviceOption = {
      id: 'dev-' + Date.now(),
      name: newDeviceName.trim(),
      brand: newDeviceBrand,
      order: deviceList.length + 1,
      isActive: true,
    };
    IShopStore.addRepairDeviceOption(newDev);
    setDeviceList(IShopStore.getRepairDeviceOptions());
    setNewDeviceName('');
    showToast(`Đã thêm dòng máy "${newDev.name}" thành công!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'device', action: 'add', item: newDev }),
    }).catch(() => {});
  };

  const handleDeleteDevice = (id: string) => {
    const item = deviceList.find((d) => d.id === id);
    if (!item) return;
    if (!confirm(`Xóa dòng máy "${item.name}" khỏi danh mục đặt lịch?`)) return;
    IShopStore.deleteRepairDeviceOption(id);
    setDeviceList(IShopStore.getRepairDeviceOptions());
    showToast(`Đã xóa dòng máy "${item.name}"!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'device', action: 'delete', id }),
    }).catch(() => {});
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    if (editingService) {
      const updatedSrv: RepairServiceCatalogItem = {
        ...editingService,
        name: newServiceName.trim(),
        category: newServiceCategory,
        deviceBrand: newServiceBrand,
        deviceModels: newServiceModels.trim() || 'Tất cả dòng máy',
        price: Number(newServicePrice) || 0,
        warranty: newServiceWarranty || '06 Tháng',
        estimatedMinutes: Number(newServiceMinutes) || 30,
      };
      IShopStore.updateRepairServiceCatalog(editingService.id, updatedSrv);
      setServiceCatalog(IShopStore.getRepairServiceCatalog());
      showToast(`Đã cập nhật dịch vụ "${updatedSrv.name}" thành công!`);

      fetch('/api/repairs/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'service', action: 'update', item: updatedSrv }),
      }).catch(() => {});

      handleCancelEditService();
    } else {
      const newSrv: RepairServiceCatalogItem = {
        id: 'srv-' + Date.now(),
        name: newServiceName.trim(),
        category: newServiceCategory,
        price: Number(newServicePrice) || 0,
        warranty: newServiceWarranty || '06 Tháng',
        estimatedMinutes: Number(newServiceMinutes) || 30,
        deviceBrand: newServiceBrand,
        deviceModels: newServiceModels.trim() || 'Tất cả dòng máy',
        isActive: true,
      };
      IShopStore.addRepairServiceCatalog(newSrv);
      setServiceCatalog(IShopStore.getRepairServiceCatalog());
      showToast(`Đã thêm dịch vụ "${newSrv.name}" thành công!`);

      fetch('/api/repairs/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'service', action: 'add', item: newSrv }),
      }).catch(() => {});

      handleCancelEditService();
    }
  };

  const handleStartEditService = (srv: RepairServiceCatalogItem) => {
    setEditingService(srv);
    setNewServiceName(srv.name);
    setNewServicePrice(srv.price);
    setNewServiceWarranty(srv.warranty);
    setNewServiceMinutes(srv.estimatedMinutes || 30);
    setNewServiceBrand(srv.deviceBrand || 'Apple');
    setNewServiceCategory(srv.category || 'battery');
    setNewServiceModels(srv.deviceModels || 'iPhone 15 Series');
  };

  const handleCancelEditService = () => {
    setEditingService(null);
    setNewServiceName('');
    setNewServicePrice(650000);
    setNewServiceWarranty('12 Tháng');
    setNewServiceMinutes(30);
    setNewServiceBrand('Apple');
    setNewServiceCategory('battery');
    setNewServiceModels('iPhone 15 Series');
  };

  const handleDeleteService = (id: string) => {
    const item = serviceCatalog.find((s) => s.id === id);
    if (!item) return;
    if (!confirm(`Xóa dịch vụ "${item.name}" khỏi bảng giá đặt hẹn?`)) return;
    IShopStore.deleteRepairServiceCatalog(id);
    setServiceCatalog(IShopStore.getRepairServiceCatalog());
    showToast(`Đã xóa dịch vụ "${item.name}"!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'service', action: 'delete', id }),
    }).catch(() => {});
  };

  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymptomTitle.trim()) return;
    const newSym: RepairSymptomOption = {
      id: 'sym-' + Date.now(),
      code: 'sym-' + Date.now(),
      title: newSymptomTitle.trim(),
      description: newSymptomDesc.trim(),
      icon: newSymptomIcon || '📱',
      category: 'general',
    };
    IShopStore.addRepairSymptomOption(newSym);
    setSymptomList(IShopStore.getRepairSymptomOptions());
    setNewSymptomTitle('');
    setNewSymptomDesc('');
    showToast(`Đã thêm triệu chứng lỗi "${newSym.title}"!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'symptom', action: 'add', item: newSym }),
    }).catch(() => {});
  };

  const handleDeleteSymptom = (id: string) => {
    const item = symptomList.find((s) => s.id === id);
    if (!item) return;
    if (!confirm(`Xóa triệu chứng "${item.title}"?`)) return;
    IShopStore.deleteRepairSymptomOption(id);
    setSymptomList(IShopStore.getRepairSymptomOptions());
    showToast(`Đã xóa triệu chứng "${item.title}"!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'symptom', action: 'delete', id }),
    }).catch(() => {});
  };

  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeSlotTime.trim() || !newTimeSlotLabel.trim()) return;
    const newSlot: RepairTimeSlotOption = {
      id: 'ts-' + Date.now(),
      time: newTimeSlotTime.trim(),
      label: newTimeSlotLabel.trim(),
      period: newTimeSlotPeriod,
    };
    IShopStore.addRepairTimeSlotOption(newSlot);
    setTimeSlots(IShopStore.getRepairTimeSlotOptions());
    showToast(`Đã thêm khung giờ "${newSlot.label}"!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'timeSlot', action: 'add', item: newSlot }),
    }).catch(() => {});
  };

  const handleDeleteTimeSlot = (id: string) => {
    const item = timeSlots.find((t) => t.id === id);
    if (!item) return;
    if (!confirm(`Xóa khung giờ "${item.label}"?`)) return;
    IShopStore.deleteRepairTimeSlotOption(id);
    setTimeSlots(IShopStore.getRepairTimeSlotOptions());
    showToast(`Đã xóa khung giờ "${item.label}"!`);

    fetch('/api/repairs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'timeSlot', action: 'delete', id }),
    }).catch(() => {});
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Post to live MySQL Database
    try {
      await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: intakeForm.customerName,
          customerPhone: intakeForm.customerPhone,
          customerAddress: intakeForm.customerAddress,
          deviceModel: intakeForm.deviceModel,
          imeiOrSerial: intakeForm.imeiOrSerial || 'Chưa rõ',
          unlockPasscode: intakeForm.unlockPasscode || 'Không có',
          appearanceCondition: intakeForm.appearanceCondition,
          accessoriesIncluded: intakeForm.accessoriesIncluded,
          issueDescription: intakeForm.issueDescription,
          laborFee: Number(intakeForm.laborFee) || 0,
          estimatedDeliveryDate: intakeForm.estimatedDeliveryDate,
        }),
      });
    } catch (err) {
      console.warn('API repair ticket notice:', err);
    }

    // 2. Also save to client store for immediate receipt printing
    const created = IShopStore.createRepairTicket({
      customerName: intakeForm.customerName,
      customerPhone: intakeForm.customerPhone,
      customerAddress: intakeForm.customerAddress,
      deviceModel: intakeForm.deviceModel,
      imeiOrSerial: intakeForm.imeiOrSerial || 'Chưa rõ',
      unlockPasscode: intakeForm.unlockPasscode || 'Không có',
      appearanceCondition: intakeForm.appearanceCondition,
      accessoriesIncluded: intakeForm.accessoriesIncluded,
      issueDescription: intakeForm.issueDescription,
      status: 'received',
      laborFee: Number(intakeForm.laborFee) || 0,
      estimatedDeliveryDate: intakeForm.estimatedDeliveryDate,
      receivedAt: now,
      technicianName: intakeForm.technicianName,
      warrantyPeriod: intakeForm.warrantyPeriod,
    });

    setIsCreateModalOpen(false);
    setPrintTicket(created);
    loadData();
    showToast(`Đã tiếp nhận máy ${created.ticketCode} thành công!`);
  };

  const handleOpenTicket = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setTempLaborFee(ticket.laborFee || 0);
    setIsEditingLaborFee(false);
    setSelectedPartId('');
    setSelectedPartQty(1);
    setStepNote('');
  };

  const handleUpdateStep = async (newStatus: RepairStatus) => {
    if (!selectedTicket) return;
    const actor = 'KTV ' + (selectedTicket.technicianName || 'Nghĩa');
    
    // 1. Optimistic update local store
    IShopStore.updateRepairStatus(selectedTicket.id, newStatus, stepNote, actor);
    
    // 2. Optimistic update local state immediately
    const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
    if (updated) {
      setSelectedTicket(updated);
      setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
    setStepNote('');
    showToast(`Đã chuyển sang bước "${statusBadge[newStatus]?.label || newStatus}"`);

    // 3. Sync to API
    try {
      await fetch('/api/repairs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          ticketCode: selectedTicket.ticketCode,
          status: newStatus,
          note: stepNote,
          actor,
        }),
      });
    } catch (err) {
      console.warn('Failed to sync repair status to MySQL:', err);
    }
  };

  const handleQuickAdvanceStep = async (ticket: RepairTicket) => {
    const steps: RepairStatus[] = [
      'received',
      'inspecting',
      'repairing',
      'qc_checking',
      'ready_for_pickup',
      'delivered',
    ];
    const currentIndex = steps.indexOf(ticket.status);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      const nextStatus = steps[currentIndex + 1];
      const actor = 'KTV ' + (ticket.technicianName || 'Nghĩa');
      IShopStore.updateRepairStatus(ticket.id, nextStatus, 'Chuyển nhanh bước từ Bàn Sửa Chữa', actor);
      const updated = IShopStore.getRepairByCode(ticket.ticketCode);
      if (updated) {
        setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
      showToast(`Phiếu ${ticket.ticketCode} đã chuyển sang "${statusBadge[nextStatus]?.label || nextStatus}"`);

      try {
        await fetch('/api/repairs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: ticket.id,
            ticketCode: ticket.ticketCode,
            status: nextStatus,
            note: 'Chuyển nhanh bước từ Bàn Sửa Chữa',
            actor,
          }),
        });
      } catch (err) {
        console.warn('API sync err:', err);
      }
    }
  };

  const handleUseSparePart = async () => {
    if (!selectedTicket || !selectedPartId) return;
    try {
      const qty = Number(selectedPartQty) || 1;
      IShopStore.consumeSparePart(selectedTicket.id, selectedPartId, qty);
      setSelectedPartId('');
      setSelectedPartQty(1);
      const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
      if (updated) {
        setSelectedTicket(updated);
        setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSpareParts(IShopStore.getSpareParts());
        showToast('Đã xuất linh kiện vào phiếu sửa chữa!');

        // Sync to MySQL Database with partsUsed
        await fetch('/api/repairs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updated.id,
            ticketCode: updated.ticketCode,
            partsUsed: updated.partsUsed,
            laborFee: updated.laborFee,
          }),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất linh kiện');
    }
  };

  const handleRemoveSparePart = async (partId: string) => {
    if (!selectedTicket) return;
    if (!confirm('Bạn có chắc muốn hủy xuất linh kiện này và hoàn lại vào kho?')) return;
    try {
      IShopStore.removeSparePart(selectedTicket.id, partId);
      const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
      if (updated) {
        setSelectedTicket(updated);
        setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSpareParts(IShopStore.getSpareParts());
        showToast('Đã hoàn linh kiện về kho thành công!');

        await fetch('/api/repairs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updated.id,
            ticketCode: updated.ticketCode,
            partsUsed: updated.partsUsed,
            laborFee: updated.laborFee,
          }),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hoàn linh kiện');
    }
  };

  const handleSaveLaborFee = async () => {
    if (!selectedTicket) return;
    try {
      IShopStore.updateRepairLaborFee(selectedTicket.id, tempLaborFee);
      const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
      if (updated) {
        setSelectedTicket(updated);
        setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setIsEditingLaborFee(false);
        showToast('Đã cập nhật tiền công sửa chữa!');

        await fetch('/api/repairs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updated.id,
            ticketCode: updated.ticketCode,
            partsUsed: updated.partsUsed,
            laborFee: tempLaborFee,
          }),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật tiền công');
    }
  };

  const handleCopyPasscode = (pass: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    showToast(`Đã sao chép mật khẩu máy: ${pass}`);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const received = repairs.filter((r) => r.status === 'received').length;
    const inspecting = repairs.filter((r) => r.status === 'inspecting').length;
    const repairing = repairs.filter((r) => r.status === 'repairing').length;
    const qcOrReady = repairs.filter(
      (r) => r.status === 'qc_checking' || r.status === 'ready_for_pickup'
    ).length;
    const delivered = repairs.filter((r) => r.status === 'delivered').length;
    const totalDeliveredRevenue = repairs
      .filter((r) => r.status === 'delivered')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    return { received, inspecting, repairing, qcOrReady, delivered, totalDeliveredRevenue };
  }, [repairs]);

  // Filtered repairs
  const filteredRepairs = useMemo(() => {
    return repairs
      .filter((r) => (filterStatus === 'all' ? true : r.status === filterStatus))
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (r.ticketCode && r.ticketCode.toLowerCase().includes(q)) ||
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.customerPhone && r.customerPhone.includes(q)) ||
          (r.deviceModel && r.deviceModel.toLowerCase().includes(q)) ||
          (r.unlockPasscode && r.unlockPasscode.toLowerCase().includes(q)) ||
          (r.issueDescription && r.issueDescription.toLowerCase().includes(q))
        );
      });
  }, [repairs, filterStatus, searchQuery]);

  // Spare parts filtered by search
  const filteredSpareParts = useMemo(() => {
    if (!partSearchQuery.trim()) return spareParts;
    const q = partSearchQuery.toLowerCase().trim();
    return spareParts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }, [spareParts, partSearchQuery]);

  const statusBadge: Record<RepairStatus, { label: string; color: string; dot: string }> = {
    received: { label: '1. Tiếp nhận', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    inspecting: { label: '2. Báo giá & Chờ duyệt', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    repairing: { label: '3. Đang sửa trên bàn', color: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
    qc_checking: { label: '4. Kiểm tra QC', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
    ready_for_pickup: { label: '5. Sẵn sàng giao', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
    delivered: { label: '6. Đã bàn giao', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    cancelled: { label: 'Hủy sửa', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  };

  const kanbanColumns: {
    status: RepairStatus;
    title: string;
    icon: any;
    badgeStyle: string;
    borderTop: string;
  }[] = [
    {
      status: 'received',
      title: '1. Tiếp Nhận',
      icon: Clock,
      badgeStyle: 'bg-sky-100 text-sky-800',
      borderTop: 'border-t-sky-500',
    },
    {
      status: 'inspecting',
      title: '2. Báo Giá / Chờ Duyệt',
      icon: Activity,
      badgeStyle: 'bg-purple-100 text-purple-800',
      borderTop: 'border-t-purple-500',
    },
    {
      status: 'repairing',
      title: '3. Đang Sửa Trên Bàn',
      icon: Wrench,
      badgeStyle: 'bg-amber-100 text-amber-900',
      borderTop: 'border-t-amber-500',
    },
    {
      status: 'qc_checking',
      title: '4. Kiểm Tra QC',
      icon: ShieldCheck,
      badgeStyle: 'bg-cyan-100 text-cyan-800',
      borderTop: 'border-t-cyan-500',
    },
    {
      status: 'ready_for_pickup',
      title: '5. Sẵn Sàng Giao',
      icon: CheckCircle2,
      badgeStyle: 'bg-emerald-100 text-emerald-800',
      borderTop: 'border-t-emerald-500',
    },
    {
      status: 'delivered',
      title: '6. Đã Bàn Giao',
      icon: DollarSign,
      badgeStyle: 'bg-slate-200 text-slate-800',
      borderTop: 'border-t-slate-400',
    },
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Phân Hệ Kỹ Thuật</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Bàn Sửa Chữa iCare Lab 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Wrench className="w-6 h-6 text-amber-600" />
            <span>Bàn Sửa Chữa &amp; Tiếp Nhận Kỹ Thuật (iCare Desk)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Tiếp nhận máy 30s, bàn làm việc kỹ thuật Kanban 6 bước, quản lý mật khẩu máy, xuất kho linh kiện và in phiếu K80 QR.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bàn Kỹ Thuật</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh Sách</span>
            </button>
          </div>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Cấu hình danh mục cho khách hàng đặt hẹn online"
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Cấu Hình Danh Mục ({deviceList.length + serviceCatalog.length})</span>
          </button>
          <button
            onClick={() => exportRepairsCsv(filteredRepairs)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Xuất danh sách phiếu sửa chữa ra file Excel CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => {
              setIntakeForm((prev) => ({
                ...prev,
                customerName: '',
                customerPhone: '',
                unlockPasscode: '',
                imeiOrSerial: '',
                estimatedDeliveryDate: getInitialDeliveryDate(),
              }));
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition-transform hover:scale-105 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tiếp Nhận Máy Mới (30s)</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-amber-500/50 flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Overview Summary Cards (5 Thẻ Thống Kê Nhanh Của Bàn Sửa Chữa) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Tiếp Nhận Mới</span>
            <span className="text-lg font-black text-slate-900">{stats.received} máy</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Báo Giá / Chờ Duyệt</span>
            <span className="text-lg font-black text-slate-900">{stats.inspecting} máy</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-amber-800 block">Đang Sửa Trên Bàn</span>
            <span className="text-lg font-black text-amber-900">{stats.repairing} máy</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">QC &amp; Sẵn Sàng Giao</span>
            <span className="text-lg font-black text-slate-900">{stats.qcOrReady} máy</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-500 block">Đã Giao ({stats.delivered} máy)</span>
            <span className="text-sm font-black text-amber-700 font-mono">
              {formatVND(stats.totalDeliveredRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã phiếu (SC-xxxx), tên khách, SĐT, dòng máy, mật khẩu mở máy..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'received', label: 'Tiếp nhận' },
            { key: 'inspecting', label: 'Báo giá' },
            { key: 'repairing', label: 'Đang sửa' },
            { key: 'qc_checking', label: 'QC' },
            { key: 'ready_for_pickup', label: 'Sẵn sàng' },
            { key: 'delivered', label: 'Đã giao' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                filterStatus === item.key
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE 1: BÀN KỸ THUẬT (KANBAN BOARD 6 BƯỚC) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const ColumnIcon = col.icon;
            const columnTickets = filteredRepairs.filter((r) => r.status === col.status);

            return (
              <div
                key={col.status}
                className={`bg-slate-50/70 border border-slate-200 rounded-2xl p-3 space-y-3 border-t-4 ${col.borderTop} min-h-[450px] shadow-2xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <ColumnIcon className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">{col.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${col.badgeStyle}`}>
                    {columnTickets.length}
                  </span>
                </div>

                {/* Tickets in column */}
                <div className="space-y-2.5">
                  {columnTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-xl p-3 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all space-y-2.5 group"
                    >
                      {/* Top: Ticket Code & Received Time */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {ticket.ticketCode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ticket.receivedAt?.split(' ')[0] || ''}
                        </span>
                      </div>

                      {/* Device & Passcode */}
                      <div>
                        <div className="font-black text-xs text-slate-900 flex items-center justify-between">
                          <span className="truncate" title={ticket.deviceModel}>
                            {ticket.deviceModel}
                          </span>
                        </div>
                        {ticket.unlockPasscode && (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyPasscode(ticket.unlockPasscode)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold border border-amber-300 hover:bg-amber-200 transition-colors"
                              title="Bấm để copy mật khẩu máy"
                            >
                              <KeyRound className="w-3 h-3 text-amber-700" />
                              <span>Pass: {ticket.unlockPasscode}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Customer info */}
                      <div className="text-[11px] text-slate-600">
                        <p className="font-semibold text-slate-800 truncate">{ticket.customerName}</p>
                        <p className="font-mono text-[10px] text-blue-600 font-bold">{ticket.customerPhone}</p>
                      </div>

                      {/* Issue summary */}
                      <p
                        className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100"
                        title={ticket.issueDescription}
                      >
                        {ticket.issueDescription}
                      </p>

                      {/* Parts and Cost */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">
                          {ticket.partsUsed?.length > 0 ? `${ticket.partsUsed.length} LK` : 'Chưa xuất LK'}
                        </span>
                        <span className="font-black font-mono text-amber-700 text-xs">
                          {formatVND(ticket.totalAmount)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleOpenTicket(ticket)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-bold transition-all text-center cursor-pointer shadow-2xs"
                        >
                          Xử lý
                        </button>
                        {col.status !== 'delivered' && (
                          <button
                            onClick={() => handleQuickAdvanceStep(ticket)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-slate-950 border border-amber-200 transition-colors cursor-pointer"
                            title="Chuyển nhanh sang bước kỹ thuật kế tiếp"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setPrintTicket(ticket)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                          title="In phiếu K80"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs font-mono border-2 border-dashed border-slate-200 rounded-xl">
                      Trống
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: DANH SÁCH BẢNG (TABLE VIEW) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 sm:p-5">Mã Phiếu &amp; Ngày</th>
                  <th className="p-4 sm:p-5">Khách Hàng</th>
                  <th className="p-4 sm:p-5">Thiết Bị &amp; Mật Khẩu</th>
                  <th className="p-4 sm:p-5">Tình Trạng Lỗi</th>
                  <th className="p-4 sm:p-5">Trạng Thái Kỹ Thuật</th>
                  <th className="p-4 sm:p-5 text-right">Chi Phí</th>
                  <th className="p-4 sm:p-5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRepairs.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 sm:p-5 font-mono">
                      <span className="font-bold text-amber-700 block text-sm">{ticket.ticketCode}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {ticket.receivedAt?.split(' ')[0] || ''}
                      </span>
                    </td>

                    <td className="p-4 sm:p-5">
                      <span className="font-bold text-slate-900 block text-sm">{ticket.customerName}</span>
                      <span className="text-xs text-blue-600 font-mono font-bold">{ticket.customerPhone}</span>
                    </td>

                    <td className="p-4 sm:p-5">
                      <span className="font-bold text-slate-900 block">{ticket.deviceModel}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Pass: <strong className="text-slate-800">{ticket.unlockPasscode || 'Không có'}</strong>
                        </span>
                        {ticket.unlockPasscode && (
                          <button
                            type="button"
                            onClick={() => handleCopyPasscode(ticket.unlockPasscode)}
                            className="p-0.5 text-amber-600 hover:text-amber-800 transition-colors"
                            title="Sao chép pass"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="p-4 sm:p-5 max-w-[200px]">
                      <p className="text-xs text-slate-800 truncate font-semibold" title={ticket.issueDescription}>
                        {ticket.issueDescription}
                      </p>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {ticket.appearanceCondition}
                      </span>
                    </td>

                    <td className="p-4 sm:p-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                          statusBadge[ticket.status]?.color || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge[ticket.status]?.dot || 'bg-slate-400'}`} />
                        <span>{statusBadge[ticket.status]?.label || ticket.status}</span>
                      </span>
                    </td>

                    <td className="p-4 sm:p-5 text-right font-black text-slate-900 font-mono text-sm">
                      {formatVND(ticket.totalAmount)}
                    </td>

                    <td className="p-4 sm:p-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenTicket(ticket)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Xử lý
                        </button>
                        <button
                          onClick={() => setPrintTicket(ticket)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                          title="In phiếu biên nhận K80 có QR"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRepairs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 text-xs font-mono">
                      Không tìm thấy phiếu sửa chữa nào khớp với tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. Modal Lập Biên Nhận 30 Giây (Intake Form) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Tiếp Nhận Sửa Chữa Tại Quầy (30s)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Tên khách hàng *:</label>
                  <input
                    type="text"
                    required
                    value={intakeForm.customerName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, customerName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Số điện thoại *:</label>
                  <input
                    type="tel"
                    required
                    value={intakeForm.customerPhone}
                    onChange={(e) => setIntakeForm({ ...intakeForm, customerPhone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-700 font-mono font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Model máy *:</label>
                  <input
                    type="text"
                    required
                    list="device-model-suggestions"
                    value={intakeForm.deviceModel}
                    onChange={(e) => setIntakeForm({ ...intakeForm, deviceModel: e.target.value })}
                    placeholder="VD: iPhone 15 Pro Max"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500"
                  />
                  <datalist id="device-model-suggestions">
                    {deviceList.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Số IMEI/Serial:</label>
                  <input
                    type="text"
                    value={intakeForm.imeiOrSerial}
                    onChange={(e) => setIntakeForm({ ...intakeForm, imeiOrSerial: e.target.value })}
                    placeholder="15 số IMEI..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Mật khẩu mở máy:</label>
                  <input
                    type="text"
                    value={intakeForm.unlockPasscode}
                    onChange={(e) => setIntakeForm({ ...intakeForm, unlockPasscode: e.target.value })}
                    placeholder="VD: 123456 (hoặc vẽ L)"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold block">Tình trạng lỗi cần xử lý *:</label>
                  <span className="text-[11px] text-slate-500">Gợi ý lỗi nhanh:</span>
                </div>
                {/* Quick Symptom Chips */}
                {symptomList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {symptomList.slice(0, 6).map((sym) => (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => {
                          const current = intakeForm.issueDescription.trim();
                          const addition = sym.title;
                          if (!current) {
                            setIntakeForm({ ...intakeForm, issueDescription: addition });
                          } else if (!current.includes(addition)) {
                            setIntakeForm({ ...intakeForm, issueDescription: `${current}, ${addition}` });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 border border-slate-200 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        {sym.icon || '📱'} {sym.title}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  rows={2}
                  required
                  value={intakeForm.issueDescription}
                  onChange={(e) => setIntakeForm({ ...intakeForm, issueDescription: e.target.value })}
                  placeholder="Rơi nứt kính, sọc màn hình, pin chai phồng, sạc không vào..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Ngoại quan &amp; phụ kiện gửi kèm:</label>
                  <input
                    type="text"
                    value={intakeForm.appearanceCondition}
                    onChange={(e) => setIntakeForm({ ...intakeForm, appearanceCondition: e.target.value })}
                    placeholder="Móp góc, trầy viền, không phụ kiện..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Tiền công dịch vụ (ước tính):</label>
                  <input
                    type="number"
                    value={intakeForm.laborFee}
                    onChange={(e) => setIntakeForm({ ...intakeForm, laborFee: Number(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-bold font-mono text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Kỹ thuật viên phụ trách:</label>
                  <input
                    type="text"
                    value={intakeForm.technicianName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, technicianName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Dự kiến giao máy:</label>
                  <input
                    type="text"
                    value={intakeForm.estimatedDeliveryDate}
                    onChange={(e) => setIntakeForm({ ...intakeForm, estimatedDeliveryDate: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>XÁC NHẬN TIẾP NHẬN &amp; IN BIÊN NHẬN QR CODE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Bàn Sửa Chữa (Workbench Detail Modal) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold">
                  <Wrench className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      {selectedTicket.ticketCode}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        statusBadge[selectedTicket.status]?.color || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge[selectedTicket.status]?.dot || 'bg-slate-400'}`} />
                      <span>{statusBadge[selectedTicket.status]?.label || selectedTicket.status}</span>
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mt-1">
                    {selectedTicket.deviceModel} • {selectedTicket.customerName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Device Info & Passcode Quick Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Passcode Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mật Khẩu Máy:</span>
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-slate-900">
                    {selectedTicket.unlockPasscode || 'Không có'}
                  </span>
                  {selectedTicket.unlockPasscode && (
                    <button
                      type="button"
                      onClick={() => handleCopyPasscode(selectedTicket.unlockPasscode)}
                      className="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Sao chép mật khẩu"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedPass ? 'Đã chép' : 'Chép'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Khách Hàng:</span>
                </span>
                <p className="font-bold text-xs text-slate-900 truncate">{selectedTicket.customerName}</p>
                <a
                  href={`tel:${selectedTicket.customerPhone}`}
                  className="font-mono text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{selectedTicket.customerPhone}</span>
                </a>
              </div>

              {/* Hardware Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>IMEI / Ngoại Quan:</span>
                </span>
                <p className="font-mono text-[11px] text-slate-800 truncate" title={selectedTicket.imeiOrSerial}>
                  IMEI: {selectedTicket.imeiOrSerial || 'Chưa rõ'}
                </p>
                <p className="text-[10px] text-slate-500 truncate" title={selectedTicket.appearanceCondition}>
                  {selectedTicket.appearanceCondition || 'Bình thường'}
                </p>
              </div>

              {/* Technician & Appointment */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>KTV &amp; Hẹn Giao:</span>
                </span>
                <p className="font-bold text-xs text-slate-800 truncate">
                  KTV: {selectedTicket.technicianName || 'Nghĩa'}
                </p>
                <p className="font-mono text-[10px] text-emerald-700 truncate" title={selectedTicket.estimatedDeliveryDate}>
                  Hẹn: {selectedTicket.estimatedDeliveryDate || 'Trong ngày'}
                </p>
              </div>
            </div>

            {/* Issue Description Banner */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Mô Tả Lỗi Ban Đầu Tiếp Nhận:</span>
              </span>
              <p className="text-xs font-semibold text-slate-900">
                {selectedTicket.issueDescription || 'Không có mô tả chi tiết'}
              </p>
            </div>

            {/* 6-Step Technical Pipeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Tiến Trình 6 Bước Kỹ Thuật (Bấm để chuyển bước):</span>
                </label>
                <span className="text-[11px] text-slate-500">Tự động đồng bộ QR khách xem live</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {(
                  [
                    'received',
                    'inspecting',
                    'repairing',
                    'qc_checking',
                    'ready_for_pickup',
                    'delivered',
                  ] as RepairStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStep(st)}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      selectedTicket.status === st
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{statusBadge[st].label}</span>
                    {selectedTicket.status === st && (
                      <span className="text-[10px] uppercase tracking-wider text-slate-950/80 font-mono font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đang ở bước này
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Step Note input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={stepNote}
                  onChange={(e) => setStepNote(e.target.value)}
                  placeholder="Ghi chú bước kỹ thuật (VD: Đã test áp suất đạt, thay pin Pisen xong, sạc nhanh ổn định...)"
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStep(selectedTicket.status)}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Lưu Ghi Chú
                </button>
              </div>

              {/* Status History Timeline */}
              {selectedTicket.statusHistory && selectedTicket.statusHistory.length > 0 && (
                <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-1.5 text-xs max-h-36 overflow-y-auto">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" />
                    <span>Lịch sử các bước kỹ thuật:</span>
                  </span>
                  <div className="space-y-1">
                    {selectedTicket.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">
                          {h.time.split(' ')[1] || h.time}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">{h.label}:</span>
                        <span className="text-slate-600 truncate">{h.note}</span>
                        <span className="text-[10px] text-slate-400 italic ml-auto shrink-0">({h.actor})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Spare Parts Deduct From Inventory */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Xuất Kho Linh Kiện Sửa Chữa Vào Phiếu:</span>
                </span>
                <span className="text-[11px] text-slate-500">Tồn kho tự trừ và tính vào tổng chi phí</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn linh kiện từ kho ({spareParts.length} mục) --</option>
                  {filteredSpareParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tồn: {p.stock} {p.unit} - Giá {formatVND(p.retailRepairPrice)})
                    </option>
                  ))}
                </select>

                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={selectedPartQty}
                    onChange={(e) => setSelectedPartQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold font-mono focus:outline-none focus:border-blue-500"
                    placeholder="SL"
                  />
                </div>

                <button
                  onClick={handleUseSparePart}
                  disabled={!selectedPartId}
                  className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-sm"
                >
                  Xuất kho (-{selectedPartQty})
                </button>
              </div>

              {/* List of parts already used */}
              {selectedTicket.partsUsed && selectedTicket.partsUsed.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[11px] font-semibold">Linh kiện đã dùng trong phiếu này:</span>
                  {selectedTicket.partsUsed.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <span className="text-slate-900 font-bold block">{p.partName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Số lượng: {p.quantity || 1} • Đơn giá: {formatVND(p.unitPrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-700 font-black font-mono">
                          {formatVND((p.quantity || 1) * p.unitPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSparePart(p.partId)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hủy xuất và hoàn trả linh kiện về kho"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total summary & Action */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Labor Fee */}
                <div>
                  <span className="text-xs text-slate-600 block">Tiền công thợ sửa chữa:</span>
                  {isEditingLaborFee ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={tempLaborFee}
                        onChange={(e) => setTempLaborFee(Number(e.target.value) || 0)}
                        className="w-36 p-1.5 bg-white border border-amber-400 rounded-lg font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleSaveLaborFee}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingLaborFee(false)}
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {formatVND(selectedTicket.laborFee)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempLaborFee(selectedTicket.laborFee || 0);
                          setIsEditingLaborFee(true);
                        }}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Cost */}
                <div className="text-right">
                  <span className="text-xs text-slate-600 block">Tổng chi phí thanh toán:</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {formatVND(selectedTicket.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                <button
                  onClick={() => setPrintTicket(selectedTicket)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer border border-slate-300 shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-slate-700" />
                  <span>In Phiếu K80 (QR)</span>
                </button>
                {selectedTicket.status !== 'delivered' && (
                  <button
                    onClick={() => handleUpdateStep('delivered')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bàn Giao Máy Cho Khách</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
                >
                  Đóng Bàn Sửa Chữa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Printable Repair Receipt Modal with QR Code */}
      {printTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-black text-slate-900">Phiếu Tiếp Nhận Sửa Chữa (K80)</span>
              <button
                onClick={() => setPrintTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable K80 Repair Canvas */}
            <div
              id="printable-repair-receipt"
              className="bg-white text-black p-5 rounded-2xl mx-auto font-mono text-[11px] max-w-[320px] border border-slate-200 shadow-sm"
            >
              <div className="text-center space-y-1 pb-3 border-b border-black border-dashed">
                <h2 className="font-bold text-sm uppercase">iShop Huy Hoàng - iCare</h2>
                <p className="text-[9px]">168 Đường 3/2, Q.10 &amp; 45 Lê Văn Việt, TP. Thủ Đức</p>
                <p className="text-[9px]">Hotline: 0988.888.999</p>
                <h3 className="font-bold text-xs mt-2 uppercase">PHIẾU BIÊN NHẬN SỬA CHỮA</h3>
                <p className="text-[10px] font-bold">MÃ PHIẾU: {printTicket.ticketCode}</p>
                <p className="text-[9px]">Ngày nhận: {printTicket.receivedAt}</p>
              </div>

              <div className="py-2 space-y-1 border-b border-black border-dashed text-[10px]">
                <p>Khách hàng: <strong>{printTicket.customerName}</strong></p>
                <p>SĐT: <strong>{printTicket.customerPhone}</strong></p>
                <p>Model: <strong>{printTicket.deviceModel}</strong></p>
                <p>IMEI: {printTicket.imeiOrSerial}</p>
                <p>Mật khẩu máy: <strong>{printTicket.unlockPasscode || 'Không có'}</strong></p>
                <p>Ngoại quan: {printTicket.appearanceCondition}</p>
                <p>Lỗi ghi nhận: <strong>{printTicket.issueDescription}</strong></p>
                <p>KTV phụ trách: {printTicket.technicianName}</p>
                <p>Hẹn trả máy: <strong>{printTicket.estimatedDeliveryDate}</strong></p>
              </div>

              <div className="py-2 border-b border-black border-dashed space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Tiền công:</span>
                  <span>{formatVND(printTicket.laborFee)}</span>
                </div>
                {printTicket.partsUsed?.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>+ {p.partName}:</span>
                    <span>{formatVND(p.unitPrice * (p.quantity || 1))}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black border-dashed">
                  <span>TỔNG CHI PHÍ:</span>
                  <span>{formatVND(printTicket.totalAmount)}</span>
                </div>
              </div>

              {/* QR Code in receipt for live tracking */}
              <div className="py-3 text-center space-y-1.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `https://ishophuyhoang.vn/repair/tracking?code=${printTicket.ticketCode}`
                  )}`}
                  alt="QR Tra cứu"
                  className="w-28 h-28 mx-auto"
                />
                <p className="text-[9px] font-bold">QUÉT MÃ QR ĐỂ XEM TIẾN ĐỘ THỜI GIAN THỰC</p>
                <p className="text-[8px] italic text-gray-700">
                  {printTicket.warrantyPeriod}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>In Phiếu K80 (Ctrl + P)</span>
              </button>
              <button
                onClick={() => setPrintTicket(null)}
                className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Category Configuration Modal (Shop Side Management for Online Booking) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-4xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Cấu Hình Danh Mục Đặt Lịch (Khách Hàng)</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                      Live Store
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Thêm và điều chỉnh danh mục dòng máy, dịch vụ bảng giá, triệu chứng lỗi và khung giờ hiển thị dạng list cho khách chọn.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
              {[
                { id: 'devices', label: `1. Dòng Máy (${deviceList.length})`, icon: Smartphone },
                { id: 'services', label: `2. Dịch Vụ & Bảng Giá (${serviceCatalog.length})`, icon: Tag },
                { id: 'symptoms', label: `3. Triệu Chứng Lỗi (${symptomList.length})`, icon: AlertCircle },
                { id: 'timeSlots', label: `4. Khung Giờ (${timeSlots.length})`, icon: Clock },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = configTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setConfigTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: DÒNG MÁY SỬA CHỮA */}
            {configTab === 'devices' && (
              <div className="space-y-6">
                {/* Form Add Device */}
                <form
                  onSubmit={handleAddDevice}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-amber-600" />
                      <span>Thêm Dòng Máy Mới Vào Danh Mục</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Khách sẽ chọn trực tiếp từ danh sách này</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        placeholder="VD: iPhone 16 Pro Max, Samsung Galaxy S25 Ultra, Xiaomi 15..."
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <select
                        value={newDeviceBrand}
                        onChange={(e) => setNewDeviceBrand(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Apple">Hãng: Apple (iPhone/iPad)</option>
                        <option value="Samsung">Hãng: Samsung</option>
                        <option value="Xiaomi">Hãng: Xiaomi</option>
                        <option value="Khác">Hãng: Khác</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Lưu Dòng Máy Mới</span>
                    </button>
                  </div>
                </form>

                {/* Device List Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <tr>
                        <th className="p-3">Hãng</th>
                        <th className="p-3">Tên Dòng Máy</th>
                        <th className="p-3 text-center">Trạng Thái</th>
                        <th className="p-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deviceList.map((dev) => (
                        <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              dev.brand === 'Apple'
                                ? 'bg-slate-900 text-white'
                                : dev.brand === 'Samsung'
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}>
                              {dev.brand}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{dev.name}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đang hoạt động
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteDevice(dev.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa dòng máy này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: DỊCH VỤ & BẢNG GIÁ */}
            {configTab === 'services' && (
              <div className="space-y-6">
                {/* Form Add / Edit Service */}
                <form
                  onSubmit={handleSaveService}
                  className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                    editingService
                      ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      {editingService ? (
                        <>
                          <Pencil className="w-4 h-4 text-amber-600" />
                          <span>Chỉnh Sửa Dịch Vụ: {editingService.name}</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4 text-amber-600" />
                          <span>Thêm Dịch Vụ Sửa Chữa Mới</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Hiển thị trực tiếp trong Bảng Giá Tham Khảo &amp; Danh Mục Đặt Lịch
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Tên dịch vụ *:</label>
                      <input
                        type="text"
                        required
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="VD: Thay Cụm Chân Sạc Type-C Zin, Ép Kính Chân Không..."
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Hãng thiết bị:</label>
                      <select
                        value={newServiceBrand}
                        onChange={(e) => setNewServiceBrand(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Apple">Apple iPhone / iPad</option>
                        <option value="Samsung">Samsung Galaxy</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="Chung">Tất cả các hãng</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Dòng máy áp dụng *:</label>
                      <input
                        type="text"
                        required
                        value={newServiceModels}
                        onChange={(e) => setNewServiceModels(e.target.value)}
                        placeholder="VD: iPhone 13 / 14 Pro Max, Galaxy S24 Ultra..."
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Chi phí trọn gói (VNĐ):</label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Thời gian bảo hành:</label>
                      <input
                        type="text"
                        value={newServiceWarranty}
                        onChange={(e) => setNewServiceWarranty(e.target.value)}
                        placeholder="VD: 12 Tháng, 06 Tháng..."
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Thời gian sửa chữa dự kiến (phút) *:</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        required
                        value={newServiceMinutes}
                        onChange={(e) => setNewServiceMinutes(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Nhóm kỹ thuật:</label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="battery">Pin &amp; Nguồn</option>
                        <option value="screen">Màn hình hiển thị</option>
                        <option value="glass">Ép kính chân không</option>
                        <option value="charge_port">Cụm sạc &amp; Bo cáp</option>
                        <option value="camera">Camera &amp; Ống kính</option>
                        <option value="other">Kiểm tra &amp; Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingService && (
                      <button
                        type="button"
                        onClick={handleCancelEditService}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Hủy Chỉnh Sửa</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                    >
                      {editingService ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Lưu Cập Nhật Bảng Giá</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Lưu Dịch Vụ Mới</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Service List Table with Edit and Delete options */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <tr>
                        <th className="p-3">Tên Dịch Vụ</th>
                        <th className="p-3">Dòng Máy Áp Dụng</th>
                        <th className="p-3">Hãng</th>
                        <th className="p-3 text-center">Thời Gian Dự Kiến</th>
                        <th className="p-3 text-center">Bảo Hành</th>
                        <th className="p-3 text-right">Chi Phí Trọn Gói</th>
                        <th className="p-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceCatalog.map((srv) => (
                        <tr
                          key={srv.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            editingService?.id === srv.id ? 'bg-amber-50/70' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-900">{srv.name}</td>
                          <td className="p-3 text-slate-600 font-medium">
                            {srv.deviceModels || 'Tất cả dòng máy'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              srv.deviceBrand === 'Apple'
                                ? 'bg-slate-900 text-white'
                                : srv.deviceBrand === 'Samsung'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {srv.deviceBrand || 'Chung'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-amber-800">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px]">
                              {srv.estimatedMinutes || 30} phút
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {srv.warranty}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black font-mono text-amber-700">
                            {srv.price > 0 ? formatVND(srv.price) : 'Miễn phí'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditService(srv)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa dịch vụ và giá này"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteService(srv.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa dịch vụ này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: TRIỆU CHỨNG LỖI THƯỜNG GẶP */}
            {configTab === 'symptoms' && (
              <div className="space-y-6">
                {/* Form Add Symptom */}
                <form
                  onSubmit={handleAddSymptom}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-amber-600" />
                      <span>Thêm Triệu Chứng Lỗi Thường Gặp</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Khách có thể click chọn nhanh nhiều lỗi cùng lúc</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Icon đại diện:</label>
                      <select
                        value={newSymptomIcon}
                        onChange={(e) => setNewSymptomIcon(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="📱">📱 Màn hình / Cảm ứng</option>
                        <option value="🔋">🔋 Pin / Nguồn</option>
                        <option value="🔌">🔌 Sạc / Cổng Type-C</option>
                        <option value="📷">📷 Camera / Ống kính</option>
                        <option value="🔊">🔊 Loa / Micro</option>
                        <option value="💧">💧 Vào nước / Ẩm mạch</option>
                        <option value="📶">📶 Sóng / Wi-Fi / Bluetooth</option>
                        <option value="💥">💥 Rơi vỡ / Cấn móp viền</option>
                        <option value="🔧">🔧 Lỗi khác</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Tên triệu chứng *:</label>
                      <input
                        type="text"
                        required
                        value={newSymptomTitle}
                        onChange={(e) => setNewSymptomTitle(e.target.value)}
                        placeholder="VD: Nút nguồn bị kẹt, Face ID không nhận diện..."
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Mô tả ngắn:</label>
                      <input
                        type="text"
                        value={newSymptomDesc}
                        onChange={(e) => setNewSymptomDesc(e.target.value)}
                        placeholder="VD: Không bấm được, chập chờn"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Lưu Triệu Chứng Mới</span>
                    </button>
                  </div>
                </form>

                {/* Symptom Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {symptomList.map((sym) => (
                    <div
                      key={sym.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3 hover:border-amber-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{sym.icon || '📱'}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block">{sym.title}</span>
                          {sym.description && (
                            <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                              {sym.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSymptom(sym.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Xóa triệu chứng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: KHUNG GIỜ TIẾP NHẬN */}
            {configTab === 'timeSlots' && (
              <div className="space-y-6">
                {/* Form Add Time Slot */}
                <form
                  onSubmit={handleAddTimeSlot}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-amber-600" />
                      <span>Thêm Khung Giờ Hẹn Khách</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Giúp điều phối lượng khách tại bàn iCare</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Giờ (24h) *:</label>
                      <input
                        type="text"
                        required
                        value={newTimeSlotTime}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewTimeSlotTime(v);
                          setNewTimeSlotLabel(`${v} - ${newTimeSlotPeriod === 'morning' ? 'Sáng' : newTimeSlotPeriod === 'afternoon' ? 'Chiều' : 'Tối'}`);
                        }}
                        placeholder="VD: 11:30, 15:45..."
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Buổi:</label>
                      <select
                        value={newTimeSlotPeriod}
                        onChange={(e) => {
                          const p = e.target.value as any;
                          setNewTimeSlotPeriod(p);
                          setNewTimeSlotLabel(`${newTimeSlotTime} - ${p === 'morning' ? 'Sáng' : p === 'afternoon' ? 'Chiều' : 'Tối'}`);
                        }}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="morning">Buổi Sáng (08:30 - 12:00)</option>
                        <option value="afternoon">Buổi Chiều (13:30 - 18:00)</option>
                        <option value="evening">Buổi Tối (18:30 - 21:00)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Nhãn hiển thị *:</label>
                      <input
                        type="text"
                        required
                        value={newTimeSlotLabel}
                        onChange={(e) => setNewTimeSlotLabel(e.target.value)}
                        placeholder="VD: 10:00 - Sáng (Giờ cao điểm)"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Lưu Khung Giờ Mới</span>
                    </button>
                  </div>
                </form>

                {/* Time Slots List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {timeSlots.map((ts) => (
                    <div
                      key={ts.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{ts.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Giờ chuẩn: {ts.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTimeSlot(ts.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Xóa khung giờ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Mọi thay đổi sẽ cập nhật tức thì trên trang đặt lịch của khách hàng tại <strong className="text-slate-700 font-mono">/repair</strong>.</span>
              </span>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
              >
                Đóng &amp; Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
