-- iShop Huy Hoàng - MySQL Database Schema & DDL
-- Cơ sở dữ liệu chuẩn hóa Dạng chuẩn 3 (3NF) cho WampServer
-- Ngày xuất: 2026-11-19T13:08:01.856Z

CREATE DATABASE IF NOT EXISTS `ishop_huyhoang` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ishop_huyhoang`;

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for table `accessorycategory`
DROP TABLE IF EXISTS `accessorycategory`;
CREATE TABLE `accessorycategory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AccessoryCategory_code_key` (`code`),
  KEY `AccessoryCategory_code_idx` (`code`),
  KEY `AccessoryCategory_isActive_idx` (`isActive`),
  KEY `AccessoryCategory_displayOrder_idx` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `accessoryproduct`
DROP TABLE IF EXISTS `accessoryproduct`;
CREATE TABLE `accessoryproduct` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `costPrice` double NOT NULL,
  `sellingPrice` double NOT NULL,
  `originalPrice` double NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `minStockAlert` int NOT NULL DEFAULT '5',
  `imageUrl` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `specs` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `compatibleWith` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `discountWhenBoughtWithPhone` int NOT NULL DEFAULT '15',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `pointsToRedeem` int DEFAULT NULL,
  `rewardPoints` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `AccessoryProduct_slug_key` (`slug`),
  UNIQUE KEY `AccessoryProduct_barcode_key` (`barcode`),
  KEY `AccessoryProduct_brand_idx` (`brand`),
  KEY `AccessoryProduct_barcode_idx` (`barcode`),
  KEY `AccessoryProduct_stock_idx` (`stock`),
  KEY `AccessoryProduct_categoryId_idx` (`categoryId`),
  CONSTRAINT `fk_accessory_category` FOREIGN KEY (`categoryId`) REFERENCES `accessorycategory` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `cashbookentry`
DROP TABLE IF EXISTS `cashbookentry`;
CREATE TABLE `cashbookentry` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `paymentMethod` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referenceCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `creator` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CashbookEntry_code_key` (`code`),
  KEY `CashbookEntry_date_idx` (`date`),
  KEY `CashbookEntry_type_idx` (`type`),
  KEY `CashbookEntry_category_idx` (`category`),
  KEY `CashbookEntry_referenceCode_idx` (`referenceCode`),
  KEY `CashbookEntry_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `customer`
DROP TABLE IF EXISTS `customer`;
CREATE TABLE `customer` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalSpent` double NOT NULL DEFAULT '0',
  `points` int NOT NULL DEFAULT '0',
  `purchaseCount` int NOT NULL DEFAULT '0',
  `repairCount` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `avatar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `birthday` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'TP. Hồ Chí Minh',
  `customerType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Khách lẻ',
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'male',
  `membershipTier` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Thành viên mới',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_phone_key` (`phone`),
  KEY `Customer_phone_idx` (`phone`),
  KEY `Customer_name_idx` (`name`),
  KEY `Customer_points_idx` (`points`),
  KEY `Customer_totalSpent_idx` (`totalSpent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `invoice`
DROP TABLE IF EXISTS `invoice`;
CREATE TABLE `invoice` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` double NOT NULL,
  `discount` double NOT NULL DEFAULT '0',
  `totalAmount` double NOT NULL,
  `paymentMethod` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `cashReceived` double DEFAULT NULL,
  `cashChange` double DEFAULT NULL,
  `cashierName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `warrantyNote` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `adminApprovalNote` text COLLATE utf8mb4_unicode_ci,
  `approvedAt` datetime(3) DEFAULT NULL,
  `approvedBy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depositAmount` double DEFAULT NULL,
  `depositPercent` double DEFAULT NULL,
  `estimatedDeliveryDate` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isLargeOrder` tinyint(1) NOT NULL DEFAULT '0',
  `isPreOrder` tinyint(1) NOT NULL DEFAULT '0',
  `pointsEarned` int NOT NULL DEFAULT '0',
  `remainingBalance` double DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Invoice_invoiceCode_key` (`invoiceCode`),
  KEY `Invoice_paymentMethod_idx` (`paymentMethod`),
  KEY `Invoice_createdAt_idx` (`createdAt`),
  KEY `Invoice_status_idx` (`status`),
  KEY `Invoice_customerId_idx` (`customerId`),
  CONSTRAINT `fk_invoice_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `invoiceitem`
DROP TABLE IF EXISTS `invoiceitem`;
CREATE TABLE `invoiceitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imei` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unitPrice` double NOT NULL,
  `costPrice` double NOT NULL DEFAULT '0',
  `quantity` int NOT NULL DEFAULT '1',
  `discount` double NOT NULL DEFAULT '0',
  `subtotal` double NOT NULL,
  `warrantyMonths` int NOT NULL DEFAULT '12',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `InvoiceItem_invoiceCode_idx` (`invoiceCode`),
  KEY `InvoiceItem_productId_idx` (`productId`),
  KEY `InvoiceItem_imei_idx` (`imei`),
  CONSTRAINT `fk_invoiceitem_invoice` FOREIGN KEY (`invoiceCode`) REFERENCES `invoice` (`invoiceCode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phonebrand`
DROP TABLE IF EXISTS `phonebrand`;
CREATE TABLE `phonebrand` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logoUrl` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PhoneBrand_name_key` (`name`),
  UNIQUE KEY `PhoneBrand_slug_key` (`slug`),
  KEY `PhoneBrand_slug_idx` (`slug`),
  KEY `PhoneBrand_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phonecolor`
DROP TABLE IF EXISTS `phonecolor`;
CREATE TABLE `phonecolor` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hex` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#2B2B2B',
  `imageUrl` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PhoneColor_phoneId_name_key` (`phoneId`,`name`),
  KEY `PhoneColor_phoneId_idx` (`phoneId`),
  CONSTRAINT `fk_phonecolor_phone` FOREIGN KEY (`phoneId`) REFERENCES `phoneproduct` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phoneproduct`
DROP TABLE IF EXISTS `phoneproduct`;
CREATE TABLE `phoneproduct` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brandId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` double NOT NULL DEFAULT '5',
  `reviewCount` int NOT NULL DEFAULT '0',
  `isHot` tinyint(1) NOT NULL DEFAULT '0',
  `isNew` tinyint(1) NOT NULL DEFAULT '0',
  `specScreen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specChip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specRam` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specStorage` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specRearCamera` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specFrontCamera` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specBattery` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specCharging` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specOs` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specSim` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specWaterResistant` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specWeight` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warrantyInfo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PhoneProduct_slug_key` (`slug`),
  KEY `PhoneProduct_isHot_idx` (`isHot`),
  KEY `PhoneProduct_isNew_idx` (`isNew`),
  KEY `PhoneProduct_createdAt_idx` (`createdAt`),
  KEY `PhoneProduct_brandId_idx` (`brandId`),
  CONSTRAINT `fk_phoneproduct_brand` FOREIGN KEY (`brandId`) REFERENCES `phonebrand` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phonestock`
DROP TABLE IF EXISTS `phonestock`;
CREATE TABLE `phonestock` (
  `imei` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `costPrice` double NOT NULL,
  `sellingPrice` double NOT NULL,
  `supplierId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_stock',
  `warrantyMonths` int NOT NULL DEFAULT '12',
  `soldAt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `soldInvoiceId` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `rewardPoints` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`imei`),
  KEY `PhoneStock_phoneId_idx` (`phoneId`),
  KEY `PhoneStock_supplierId_idx` (`supplierId`),
  KEY `PhoneStock_status_idx` (`status`),
  KEY `PhoneStock_soldInvoiceId_idx` (`soldInvoiceId`),
  KEY `PhoneStock_importDate_idx` (`importDate`),
  CONSTRAINT `fk_phonestock_invoice` FOREIGN KEY (`soldInvoiceId`) REFERENCES `invoice` (`invoiceCode`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_phonestock_phone` FOREIGN KEY (`phoneId`) REFERENCES `phoneproduct` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_phonestock_supplier` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phonevariant`
DROP TABLE IF EXISTS `phonevariant`;
CREATE TABLE `phonevariant` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `colorId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `originalPrice` double DEFAULT NULL,
  `isOutOfStock` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PhoneVariant_color_cap_key` (`colorId`,`capacity`),
  KEY `PhoneVariant_capacity_idx` (`capacity`),
  CONSTRAINT `fk_phonevariant_color` FOREIGN KEY (`colorId`) REFERENCES `phonecolor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `promotion`
DROP TABLE IF EXISTS `promotion`;
CREATE TABLE `promotion` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `promoType` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'campaign',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `badgeText` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountType` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `discountValue` double NOT NULL DEFAULT '0',
  `minOrderValue` double NOT NULL DEFAULT '0',
  `startDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `targetCategory` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `bannerStyle` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qrPayload` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Promotion_code_key` (`code`),
  KEY `Promotion_type_active_idx` (`promoType`,`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairbooking`
DROP TABLE IF EXISTS `repairbooking`;
CREATE TABLE `repairbooking` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bookingCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceModel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentTime` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ticketCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RepairBooking_bookingCode_key` (`bookingCode`),
  KEY `RepairBooking_bookingCode_idx` (`bookingCode`),
  KEY `RepairBooking_status_idx` (`status`),
  KEY `RepairBooking_appointmentDate_idx` (`appointmentDate`),
  KEY `fk_repairbooking_customer` (`customerId`),
  KEY `fk_repairbooking_ticket` (`ticketCode`),
  CONSTRAINT `fk_repairbooking_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_repairbooking_ticket` FOREIGN KEY (`ticketCode`) REFERENCES `repairticket` (`ticketCode`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairbookingoption`
DROP TABLE IF EXISTS `repairbookingoption`;
CREATE TABLE `repairbookingoption` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `optionType` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `brandId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subLabel` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RepairBookingOption_type_idx` (`optionType`),
  KEY `RepairBookingOption_brandId_idx` (`brandId`),
  CONSTRAINT `fk_repairbookingoption_brand` FOREIGN KEY (`brandId`) REFERENCES `phonebrand` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairservice`
DROP TABLE IF EXISTS `repairservice`;
CREATE TABLE `repairservice` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brandId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceModels` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `originalPrice` double DEFAULT NULL,
  `warrantyPeriod` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '12 Tháng',
  `estimatedMinutes` int NOT NULL DEFAULT '30',
  `description` text COLLATE utf8mb4_unicode_ci,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RepairService_category_idx` (`category`),
  KEY `RepairService_isActive_idx` (`isActive`),
  KEY `RepairService_isFeatured_idx` (`isFeatured`),
  KEY `RepairService_brandId_idx` (`brandId`),
  CONSTRAINT `fk_repairservice_brand` FOREIGN KEY (`brandId`) REFERENCES `phonebrand` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairstatushistory`
DROP TABLE IF EXISTS `repairstatushistory`;
CREATE TABLE `repairstatushistory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statusLabel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `updatedBy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RepairStatusHistory_ticketCode_idx` (`ticketCode`),
  KEY `RepairStatusHistory_status_idx` (`status`),
  KEY `RepairStatusHistory_createdAt_idx` (`createdAt`),
  CONSTRAINT `fk_repairstatushistory_ticket` FOREIGN KEY (`ticketCode`) REFERENCES `repairticket` (`ticketCode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairticket`
DROP TABLE IF EXISTS `repairticket`;
CREATE TABLE `repairticket` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceModel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imeiOrSerial` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unlockPasscode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appearanceCondition` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessoriesIncluded` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `issueDescription` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `technicianNotes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `laborFee` double NOT NULL DEFAULT '0',
  `totalAmount` double NOT NULL DEFAULT '0',
  `estimatedDeliveryDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receivedAt` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deliveredAt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technicianId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warrantyPeriod` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `assignedBy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deadlineMinutes` int DEFAULT '60',
  `deadlineTime` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RepairTicket_ticketCode_key` (`ticketCode`),
  KEY `RepairTicket_status_idx` (`status`),
  KEY `RepairTicket_imeiOrSerial_idx` (`imeiOrSerial`),
  KEY `RepairTicket_technicianId_idx` (`technicianId`),
  KEY `RepairTicket_createdAt_idx` (`createdAt`),
  KEY `RepairTicket_customerId_idx` (`customerId`),
  CONSTRAINT `fk_repairticket_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_repairticket_technician` FOREIGN KEY (`technicianId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairticketpart`
DROP TABLE IF EXISTS `repairticketpart`;
CREATE TABLE `repairticketpart` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sparePartId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `costPrice` double NOT NULL DEFAULT '0',
  `unitPrice` double NOT NULL,
  `warrantyMonths` int NOT NULL DEFAULT '6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RepairTicketPart_ticketCode_idx` (`ticketCode`),
  KEY `RepairTicketPart_sparePartId_idx` (`sparePartId`),
  CONSTRAINT `fk_repairticketpart_part` FOREIGN KEY (`sparePartId`) REFERENCES `sparepart` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_repairticketpart_ticket` FOREIGN KEY (`ticketCode`) REFERENCES `repairticket` (`ticketCode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `rolepermission`
DROP TABLE IF EXISTS `rolepermission`;
CREATE TABLE `rolepermission` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `admin` tinyint(1) NOT NULL DEFAULT '1',
  `tech` tinyint(1) NOT NULL DEFAULT '0',
  `cashier` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RolePermission_category_idx` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sparepart`
DROP TABLE IF EXISTS `sparepart`;
CREATE TABLE `sparepart` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `costPrice` double NOT NULL,
  `retailRepairPrice` double NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cái',
  `warrantyMonths` int NOT NULL DEFAULT '6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SparePart_barcode_key` (`barcode`),
  KEY `SparePart_barcode_idx` (`barcode`),
  KEY `SparePart_stock_idx` (`stock`),
  KEY `SparePart_categoryId_idx` (`categoryId`),
  CONSTRAINT `fk_sparepart_category` FOREIGN KEY (`categoryId`) REFERENCES `sparepartcategory` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sparepartcategory`
DROP TABLE IF EXISTS `sparepartcategory`;
CREATE TABLE `sparepartcategory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SparePartCategory_code_key` (`code`),
  KEY `SparePartCategory_code_idx` (`code`),
  KEY `SparePartCategory_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sparepartcompatibility`
DROP TABLE IF EXISTS `sparepartcompatibility`;
CREATE TABLE `sparepartcompatibility` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sparePartId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceModel` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SparePartCompat_part_model_key` (`sparePartId`,`deviceModel`),
  KEY `SparePartCompat_part_idx` (`sparePartId`),
  CONSTRAINT `fk_sparepartcompat_part` FOREIGN KEY (`sparePartId`) REFERENCES `sparepart` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `storesetting`
DROP TABLE IF EXISTS `storesetting`;
CREATE TABLE `storesetting` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `storeName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'iShop Huy Hoàng',
  `hotline` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0909.123.456',
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '45 Lê Văn Việt, TP. Thủ Đức, TP.HCM',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contact@ishophuyhoang.vn',
  `bankId` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MB',
  `bankAccountNo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0988888999',
  `bankAccountName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGUYEN HUY HOANG',
  `defaultWarrantyNote` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Bảo hành điện tử chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `posDiscountRequiresApproval` tinyint(1) NOT NULL DEFAULT '1',
  `receiptFooter` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `returnPolicy` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `supplier`
DROP TABLE IF EXISTS `supplier`;
CREATE TABLE `supplier` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactPerson` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalPurchased` double NOT NULL DEFAULT '0',
  `currentDebt` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Supplier_name_idx` (`name`),
  KEY `Supplier_phone_idx` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `supplierorder`
DROP TABLE IF EXISTS `supplierorder`;
CREATE TABLE `supplierorder` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemsSummary` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalAmount` double NOT NULL,
  `paidAmount` double NOT NULL,
  `debtAmount` double NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SupplierOrder_orderCode_key` (`orderCode`),
  KEY `SupplierOrder_supplierId_idx` (`supplierId`),
  KEY `SupplierOrder_date_idx` (`date`),
  KEY `SupplierOrder_status_idx` (`status`),
  KEY `SupplierOrder_createdAt_idx` (`createdAt`),
  CONSTRAINT `fk_supplierorder_supplier` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `supplierorderitem`
DROP TABLE IF EXISTS `supplierorderitem`;
CREATE TABLE `supplierorderitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone',
  `productId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unitCost` double NOT NULL,
  `totalCost` double NOT NULL,
  `imei` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `SupplierOrderItem_orderCode_idx` (`orderCode`),
  KEY `SupplierOrderItem_productId_idx` (`productId`),
  KEY `SupplierOrderItem_imei_idx` (`imei`),
  CONSTRAINT `fk_supplierorderitem_order` FOREIGN KEY (`orderCode`) REFERENCES `supplierorder` (`orderCode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `user`
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cashier',
  `avatar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `birthday` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_role_idx` (`role`),
  KEY `User_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
