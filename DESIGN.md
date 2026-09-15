# iShop Huy Hoàng — Design System Specification (Stitch Standard)

> **Document Version**: 2.0.0 (2026 Edition)  
> **Standard**: Google Stitch Component & Design Architecture Pattern  
> **Application**: Cổng Khách Hàng & Hệ Thống Quản Trị ERP/POS iShop Huy Hoàng  
> **Target Framework**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript  

---

## 1. Executive Summary & Design Philosophy

Hệ thống thiết kế (Design System) của **iShop Huy Hoàng** tuân thủ cấu trúc chuẩn mực **Google Stitch** — một tiêu chuẩn kiến trúc giao diện cấp doanh nghiệp, phân tách thành 5 tầng rõ rệt: **Design Tokens ➔ Atoms ➔ Molecules ➔ Organisms ➔ Templates/Views**.

Phong cách thẩm mỹ chủ đạo là **Cyber-Luxe 2026 & Apple TopZone Futuristic**:
1. **Visual Depth**: Sử dụng nền vũ trụ sâu **Cosmic Obsidian** (`#06080F`) phối hợp hiệu ứng tản sáng **Mesh Nebula 3 tầng**.
2. **Metallic Accent**: Tông vàng **Desert Titanium Gold** (`#E2B774`) làm điểm nhấn sang trọng cho các dòng sản phẩm Flagship.
3. **Cyber Accents**: Sắc xanh **Cyber Cyan** (`#06B6D4`) và ngọc lục bảo **Hyper Emerald** (`#10B981`) cho các tương tác công nghệ và tài chính POS.
4. **Tactile Feedback**: Phản hồi xúc giác qua các viền phát quang phản xạ ánh sáng (**Iridescent Glow**) và quầng sáng môi trường (**Ambient Lighting**).

---

## 2. Design Foundations & Tokens (Tầng Nền Tảng)

### 2.1. Color Palette (Bảng Mã Màu 2026)

```css
:root {
  /* Surface & Background */
  --color-obsidian-950: #06080f;  /* Nền trang web chính */
  --color-obsidian-900: #0b101e;  /* Nền thẻ glassmorphism */
  --color-obsidian-800: #121829;  /* Nền nổi bật, dropdown */

  /* Primary Luxury: Desert Titanium */
  --color-gold-400: #fde047;
  --color-gold-500: #e2b774;      /* Màu Titan Sa Mạc chủ đạo */
  --color-gold-600: #c59b58;

  /* Tech Accents: Cyber Cyan & Electric Blue */
  --color-cyan-400: #22d3ee;
  --color-cyan-500: #06b6d4;      /* Màu công nghệ, Smart Search */
  --color-blue-500: #3b82f6;

  /* Commerce & Status: Hyper Emerald & Ruby */
  --color-emerald-500: #10b981;   /* Doanh thu, POS, Bảo hành OK */
  --color-emerald-400: #34d399;
  --color-rose-500: #f43f5e;      /* Cảnh báo, Nợ NCC, Hết hạn */

  /* Service Accent: Neon Amethyst */
  --color-amethyst-500: #8b5cf6;  /* Phân hệ sửa chữa iCare */
  --color-amethyst-400: #a78bfa;
}
```

### 2.2. Typography (Hệ Thống Phông Chữ)
- **Primary Font Family**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`
- **Monospace Font**: `"SF Mono", "Fira Code", "Courier New", monospace` (dành cho số IMEI, Barcode, Mã hóa đơn, Đồng hồ đếm).
- **Scale Hierarchy**:
  - `Display 1`: `clamp(2.5rem, 5vw, 4.5rem)` | Font Weight: `900 (Black)` | Line-height: `1.1`
  - `Headline 1`: `2rem` (32px) | Font Weight: `800 (Extrabold)`
  - `Headline 2`: `1.5rem` (24px) | Font Weight: `700 (Bold)`
  - `Body Regular`: `0.875rem` (14px) | Font Weight: `400 (Regular)` | Line-height: `1.5`
  - `Caption / Code`: `0.6875rem` (11px) | Font Weight: `600 (Semibold)`

### 2.3. Glassmorphism & Elevation System
| Elevation Level | CSS Utility | Backdrop Filter | Border | Box Shadow |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0 (Base)** | Default Background | None | None | None |
| **Level 1 (Card)** | `.glass-card` | `blur(16px)` | `1px solid rgba(255,255,255,0.08)` | `0 4px 20px rgba(0,0,0,0.3)` |
| **Level 2 (Elevated)** | `.glass-card:hover` | `blur(20px)` | `1px solid rgba(226,183,116,0.35)` | `0 12px 35px rgba(0,0,0,0.5), glow` |
| **Level 3 (Panel)** | `.glass-panel` | `blur(24px)` | `1px solid rgba(255,255,255,0.12)` | `0 8px 32px rgba(0,0,0,0.4)` |
| **Level 4 (Modal)** | Popups, Dialogs | `blur(32px)` | `1px solid rgba(255,255,255,0.16)` | `0 25px 60px -15px rgba(0,0,0,0.8)` |

---

## 3. Component Architecture & Taxonomy (Cấu Trúc Component)

```
src/
├── components/
│   └── customer/
│       ├── Header.tsx                 # Organism: Floating Capsule Bar
│       ├── Footer.tsx                 # Organism: 4-Pillar Value Matrix Footer
│       ├── SmartSearchModal.tsx       # Organism: Live Autocomplete Fuzzy Search
│       ├── VietQRModal.tsx            # Molecule: Napas 247 Dynamic Payment Popup
│       └── ComparisonFloatingBar.tsx  # Molecule: Sticky Bottom Comparison Dock
└── app/
    ├── (customer)/
    │   ├── page.tsx                   # View: 3D Interactive Hero & Showroom
    │   ├── phones/                    # View: Catalog & Filter
    │   │   └── [slug]/page.tsx        # View: Ambient Glow Product Detail
    │   ├── compare/page.tsx           # View: Difference-Highlight Comparison Matrix
    │   ├── warranty/page.tsx          # View: Cyber Tech Warranty Certificate Card
    │   └── repair/tracking/page.tsx   # View: 6-Step Cyber Pipeline Progress
    └── admin/
        ├── layout.tsx                 # Template: Cockpit Navigation Shell
        ├── page.tsx                   # View: Executive KPI & Revenue Stream Cockpit
        ├── pos/page.tsx               # View: Dual-Column POS & Thermal Receipt Canvas
        └── repairs/page.tsx           # View: 30s Intake Form & QR Ticket Desk
```

---

## 4. Chi Tiết Thông Số Kỹ Thuật Từng Component (Google Stitch Specs)

### 4.1. `CustomerHeader` (Floating Capsule Header)
* **File Path**: `src/components/customer/Header.tsx`
* **Type**: Organism / Navigation
* **Anatomy**:
  1. *Top Announcement*: Dải thông báo viền hổ phách mỏng (`border-amber-500/20`), thông điệp máy mới nguyên seal.
  2. *Brand Mark*: Logo `iShop Huy Hoàng` cách điệu với icon điện thoại góc nghiêng 6 độ, viền gradient vàng sa mạc.
  3. *Smart Search Pill*: Thanh tìm kiếm bo tròn (`rounded-2xl`), phím tắt `Ctrl K` phát sáng cyan.
  4. *Utility Actions*: Hotline tư vấn, Giỏ hàng động kèm badge số lượng, Nút chuyển nhanh sang **Quản Trị & POS**.
  5. *Navigation Links*: 6 liên kết có chỉ báo tab kích hoạt dạng pill phát quang (`badge-glow-gold`).
* **States**:
  - `Default`: Kính mờ trong suốt 85% kết hợp bóng đổ nhẹ.
  - `Sticky Scrolled`: Nền `#06080f/85`, `backdrop-blur-2xl`.
  - `Active Nav Item`: `bg-amber-500/15`, `text-amber-300`, `shadow-[0_0_15px_rgba(226,183,116,0.15)]`.

---

### 4.2. `ProductHeroShowcase` (Hero 3D Tương Tác)
* **File Path**: `src/app/(customer)/page.tsx`
* **Type**: Organism / Hero
* **Anatomy**:
  1. *Eyebrow Badge*: `.badge-glow-gold` với biểu tượng ngôi sao xoay `Sparkles`.
  2. *Display Headline*: Chữ `iPhone 16 Pro Max` kết hợp chữ đổ bóng ánh kim `.text-gradient-gold`.
  3. *Action Group*: Nút chính `.btn-gold`, Nút phụ kính mờ viền trắng, Nút tra cứu bảo hành ngọc lục bảo.
  4. *3D Card Spotlight*: Khung kính đa tầng chứa ảnh máy có quầng sáng tản màu theo thời gian thực.
  5. *Interactive Color Switcher*: 4 nút bấm chấm màu (*Titan Sa Mạc, Titan Đen, Titan Tự Nhiên, Titan Trắng*). Bấm đổi màu nào, ảnh và quầng sáng lập tức chuyển đổi tức thì!
* **Props & State**:
  - `heroColorIdx`: Số thứ tự màu đang kích hoạt (0 - 3).

---

### 4.3. `ProductAmbientDetail` (Chi Tiết Máy & Ambient Glow)
* **File Path**: `src/app/(customer)/phones/[slug]/page.tsx`
* **Type**: Organism / Product Detail
* **Key Innovation**: **Hiệu ứng Ambient Light (Quầng sáng môi trường tương tác)**:
  ```tsx
  style={{
    boxShadow: `0 0 70px 0px ${selectedColor.hex}33`,
  }}
  ```
  Quầng sáng phía sau máy phản xạ đúng mã màu hex của phiên bản đang chọn.
* **Storage Selector**: Thiết kế dạng pill 3 cột với viền vàng kim khi kích hoạt (`border-amber-400`, `scale-[1.02]`).
* **Combo Deals Card**: Checkbox phát sáng ngọc lục bảo khi được tích chọn, tự động tính giảm giá 15%.
* **CTA Button**: `.btn-gold` tích hợp thanh toán VietQR Napas 247 một chạm.

---

### 4.4. `ComparisonMatrix` (Bảng Ma Trận So Sánh Song Song)
* **File Path**: `src/app/(customer)/compare/page.tsx`
* **Type**: Organism / Data Comparison
* **Anatomy**:
  1. *Top Header*: Bộ chuyển đổi toggle **"Chỉ xem điểm khác biệt"** với viền cyan phát sáng (`shadow-[0_0_20px_rgba(6,182,212,0.3)]`).
  2. *Product Columns*: Tối đa 3 cột máy + 1 nút Slot thêm máy thứ 3 viền nét đứt.
  3. *Difference Highlighting*: Hàng nào có thông số khác nhau giữa các máy sẽ tự động nhận lớp phủ `.bg-cyan-500/[0.04]` kèm chấm tròn xanh cyan phát sáng.

---

### 4.5. `CyberWarrantyCard` (Thẻ Bảo Hành Kỹ Thuật Số)
* **File Path**: `src/app/(customer)/warranty/page.tsx`
* **Type**: Molecule / Certificate
* **Anatomy**:
  1. *Certificate Seal*: Huy hiệu `Award` màu vàng sa mạc trong khung kính mờ.
  2. *Validity Badge*: Huy hiệu ngọc lục bảo viền quang kèm số ngày còn lại (`Còn 365 ngày`).
  3. *Info Matrix*: Dòng máy, số IMEI, ngày kích hoạt, chủ sở hữu, mã hóa đơn POS.
  4. *Service Locator*: Thông tin trung tâm bảo hành tiếp nhận và hotline.

---

### 4.6. `AdminCockpitShell` (Khung Điều Hành Quản Trị)
* **File Path**: `src/app/admin/layout.tsx`
* **Type**: Template / Shell
* **Anatomy**:
  1. *Control Header*: Logo ngọc lục bảo phát sáng `shadow-[0_0_20px_rgba(16,185,129,0.3)]`.
  2. *Quick Access Chips*: Kế thừa nghiệp vụ *"Xem cuối"* từ `incomSoft`, hiển thị mã hóa đơn gần nhất dạng pill phát sáng viền hổ phách.
  3. *Role Switcher Modal*: Chuyển đổi giữa 3 vai trò:
     - `Admin`: Huy hiệu Vàng Sa Mạc (Toàn quyền, xem giá vốn, xem lãi gộp).
     - `Technician`: Huy hiệu Tím Neon (Xử lý phiếu sửa, xuất kho linh kiện).
     - `Cashier`: Huy hiệu Xanh Cyan (Bán hàng POS, **bảo mật ẩn hoàn toàn giá vốn**).
  4. *7-Module Navigation Bar*: Thanh điều hướng 7 phân hệ với tab kích hoạt ngọc lục bảo.

---

### 4.7. `POSRegisterTerminal` (Bàn Thu Ngân POS & In Bill K80)
* **File Path**: `src/app/admin/pos/page.tsx`
* **Type**: Organism / Transaction Terminal
* **Left Panel**:
  - Tab 1: Kho máy mới theo từng số IMEI 15 chữ số.
  - Tab 2: Kho phụ kiện quét mã vạch Barcode.
* **Right Panel (Cashier Register)**:
  - Danh sách mặt hàng giỏ hàng POS với nút tăng giảm số lượng.
  - Bộ tính tiền thối tự động: `Tiền khách đưa - Khách phải trả = Tiền thừa trả khách`.
  - Nút thanh toán mạ vàng phát sáng `.btn-gold`.
* **Print Canvas (Thermal K80 Receipt)**:
  - Khổ giấy nhiệt chuẩn **80mm (`width: 80mm !important;`)**.
  - Tự động sinh mã **VietQR Napas 247** đúng số tiền đơn hàng và nội dung chuyển khoản.
  - Định dạng font chữ `monospace` mô phỏng đầu in nhiệt thật, có nét đứt phân cách rõ ràng.

---

### 4.8. `RepairDeskPipeline` (Bàn Sửa Chữa & Phiếu In QR)
* **File Path**: `src/app/admin/repairs/page.tsx`
* **Type**: Organism / Service Desk
* **Anatomy**:
  1. *30-Second Intake Modal*: Form tiếp nhận nhanh gọn (Tên, SĐT, Model, Mật khẩu, Ngoại quan, Lỗi ghi nhận).
  2. *6-Step Cyber Stepper*:
     `Tiếp nhận ➔ Kiểm tra/Báo giá ➔ Đang sửa ➔ Kiểm tra QC ➔ Sẵn sàng ➔ Đã bàn giao`.
  3. *Automated Spare Part Deduction*: Dropdown chọn màn hình OLED, pin Pisen từ kho ➔ Bấm **"Xuất kho (-1)"** ➔ Tự động trừ kho linh kiện và cộng chi phí vào phiếu.
  4. *K80 QR Ticket*: Phiếu nhiệt có in **Mã QR Tra Cứu**, khách hàng quét bằng camera là theo dõi được tiến độ trực tiếp.

---

## 5. Bảng Ma Trận Phân Quyền Vai Trò (RBAC Matrix)

| Chức Năng / Phân Hệ | Chủ Cửa Hàng (Admin) | Kỹ Thuật Viên (Technician) | Thu Ngân (Cashier) |
| :--- | :---: | :---: | :---: |
| **Bán Hàng POS & In Hóa Đơn K80** | ✅ Cho phép | ❌ Khóa | ✅ Cho phép |
| **Tiếp Nhận Sửa Chữa & Đổi Bước** | ✅ Cho phép | ✅ Cho phép | ❌ Khóa |
| **Xuất Kho Linh Kiện Sửa Chữa** | ✅ Cho phép | ✅ Cho phép | ❌ Khóa |
| **Xem Giá Vốn Máy Mới & Linh Kiện** | ✅ Cho phép | 🔒 Ẩn giá vốn | 🔒 Ẩn giá vốn (`***`) |
| **Xem Báo Cáo Lợi Nhuận Gộp 3 Mảng** | ✅ Cho phép | 🔒 Ẩn báo cáo | 🔒 Ẩn báo cáo (`***`) |
| **Nhập Lô IMEI Từ NCC & Ghi Nợ** | ✅ Cho phép | ❌ Khóa | ❌ Khóa |
| **Sổ Quỹ Thu - Chi Toàn Cửa Hàng** | ✅ Toàn quyền | ❌ Khóa | Chỉ tạo phiếu thu bán hàng |

---

## 6. Hướng Dẫn Lập Trình Viên (Developer Integration Guide)

### 6.1. Sử dụng Button Chuẩn 2026
```tsx
// Nút Vàng Ánh Kim Titan Sa Mạc (Chính)
<button className="btn-gold px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2">
  <span>MUA NGAY (VIETQR)</span>
</button>

// Nút Kính Mờ Đa Tầng (Phụ)
<button className="px-5 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-bold transition-all">
  <span>Chi Tiết</span>
</button>
```

### 6.2. Sử dụng Huy Hiệu Phát Sáng (Glow Badges)
```tsx
<span className="badge-glow-gold px-3 py-1 rounded-full text-xs font-bold">HOT NHẤT 2026</span>
<span className="badge-glow-cyan px-3 py-1 rounded-full text-xs font-bold">MÁY MỚI SEAL</span>
<span className="badge-glow-emerald px-3 py-1 rounded-full text-xs font-bold">CÒN BẢO HÀNH</span>
<span className="badge-glow-violet px-3 py-1 rounded-full text-xs font-bold">iCARE SERVICE</span>
```

### 6.3. Chuẩn In Hóa Đơn Nhiệt K80
Mọi nội dung hóa đơn nhiệt phải được bọc trong class `.print-area` để tự động ngắt kích thước **80mm** và ẩn toàn bộ thanh điều hướng, nút bấm của website khi bấm `Ctrl + P`:
```tsx
<div className="print-area font-mono text-[11px] max-w-[320px]">
  {/* Nội dung in nhiệt K80 */}
</div>
```

---

*Tài liệu này là đặc tả chuẩn mực cho mọi thành phần giao diện hiện tại và tương lai của hệ thống iShop Huy Hoàng.*
