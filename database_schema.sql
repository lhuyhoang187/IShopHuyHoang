-- iShop Huy Hoàng - MySQL Database Schema & DDL
-- Cơ sở dữ liệu chuẩn hóa Dạng chuẩn 3 (3NF) cho WampServer
-- Ngày xuất: 2026-11-17T14:34:16.956Z

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `accessoryproduct`
DROP TABLE IF EXISTS `accessoryproduct`;
CREATE TABLE `accessoryproduct` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  KEY `AccessoryProduct_category_idx` (`category`),
  KEY `AccessoryProduct_brand_idx` (`brand`),
  KEY `AccessoryProduct_barcode_idx` (`barcode`),
  KEY `AccessoryProduct_stock_idx` (`stock`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `auditlog`
DROP TABLE IF EXISTS `auditlog`;
CREATE TABLE `auditlog` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `performedBy` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_action_idx` (`action`),
  KEY `AuditLog_entity_idx` (`entity`),
  KEY `AuditLog_entityId_idx` (`entityId`),
  KEY `AuditLog_createdAt_idx` (`createdAt`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `cashbookentry`
DROP TABLE IF EXISTS `cashbookentry`;
CREATE TABLE `cashbookentry` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryLabel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `avatar` longtext COLLATE utf8mb4_unicode_ci,
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `emailnotification`
DROP TABLE IF EXISTS `emailnotification`;
CREATE TABLE `emailnotification` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toEmail` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contentSummary` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `htmlContent` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `referenceCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `EmailNotification_toEmail_idx` (`toEmail`),
  KEY `EmailNotification_customerPhone_idx` (`customerPhone`),
  KEY `EmailNotification_referenceCode_idx` (`referenceCode`),
  KEY `EmailNotification_type_idx` (`type`),
  KEY `EmailNotification_customerId_fkey` (`customerId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `invoice`
DROP TABLE IF EXISTS `invoice`;
CREATE TABLE `invoice` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `items` text COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `customerEmail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerTier` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  KEY `Invoice_customerPhone_idx` (`customerPhone`),
  KEY `Invoice_paymentMethod_idx` (`paymentMethod`),
  KEY `Invoice_createdAt_idx` (`createdAt`),
  KEY `Invoice_status_idx` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `invoiceitem`
DROP TABLE IF EXISTS `invoiceitem`;
CREATE TABLE `invoiceitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imei` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unitPrice` double NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `discount` double NOT NULL DEFAULT '0',
  `subtotal` double NOT NULL,
  `warrantyMonths` int NOT NULL DEFAULT '12',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `InvoiceItem_invoiceCode_idx` (`invoiceCode`),
  KEY `InvoiceItem_productId_idx` (`productId`),
  KEY `InvoiceItem_imei_idx` (`imei`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phoneproduct`
DROP TABLE IF EXISTS `phoneproduct`;
CREATE TABLE `phoneproduct` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` double NOT NULL DEFAULT '5',
  `reviewCount` int NOT NULL DEFAULT '0',
  `isHot` tinyint(1) NOT NULL DEFAULT '0',
  `isNew` tinyint(1) NOT NULL DEFAULT '0',
  `colors` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacities` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `specs` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `warrantyInfo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PhoneProduct_slug_key` (`slug`),
  KEY `PhoneProduct_brand_idx` (`brand`),
  KEY `PhoneProduct_isHot_idx` (`isHot`),
  KEY `PhoneProduct_isNew_idx` (`isNew`),
  KEY `PhoneProduct_createdAt_idx` (`createdAt`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phonestock`
DROP TABLE IF EXISTS `phonestock`;
CREATE TABLE `phonestock` (
  `imei` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `costPrice` double NOT NULL,
  `sellingPrice` double NOT NULL,
  `supplierId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `importDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_stock',
  `warrantyMonths` int NOT NULL DEFAULT '12',
  `soldAt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `soldToCustomerName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `soldToCustomerPhone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `soldInvoiceId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `rewardPoints` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`imei`),
  KEY `PhoneStock_phoneId_idx` (`phoneId`),
  KEY `PhoneStock_supplierId_idx` (`supplierId`),
  KEY `PhoneStock_status_idx` (`status`),
  KEY `PhoneStock_soldInvoiceId_idx` (`soldInvoiceId`),
  KEY `PhoneStock_soldToCustomerPhone_idx` (`soldToCustomerPhone`),
  KEY `PhoneStock_importDate_idx` (`importDate`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phonevariant`
DROP TABLE IF EXISTS `phonevariant`;
CREATE TABLE `phonevariant` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `colorName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `colorHex` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` text COLLATE utf8mb4_unicode_ci,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `originalPrice` double DEFAULT NULL,
  `isOutOfStock` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PhoneVariant_phoneId_idx` (`phoneId`),
  KEY `PhoneVariant_capacity_idx` (`capacity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `productreview`
DROP TABLE IF EXISTS `productreview`;
CREATE TABLE `productreview` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone',
  `customerId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL DEFAULT '5',
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isApproved` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductReview_productId_idx` (`productId`),
  KEY `ProductReview_isApproved_idx` (`isApproved`),
  KEY `ProductReview_customerId_fkey` (`customerId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `promoqrcode`
DROP TABLE IF EXISTS `promoqrcode`;
CREATE TABLE `promoqrcode` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `discountType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `discountValue` double NOT NULL,
  `minOrderValue` double NOT NULL DEFAULT '0',
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `qrPayload` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bannerColor` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PromoQRCode_code_key` (`code`),
  KEY `PromoQRCode_code_idx` (`code`),
  KEY `PromoQRCode_isActive_idx` (`isActive`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `promotioncampaign`
DROP TABLE IF EXISTS `promotioncampaign`;
CREATE TABLE `promotioncampaign` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `badgeText` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `discountValue` double NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `targetCategory` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `bannerGradient` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PromotionCampaign_isActive_idx` (`isActive`),
  KEY `PromotionCampaign_startDate_endDate_idx` (`startDate`,`endDate`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `redeemedgift`
DROP TABLE IF EXISTS `redeemedgift`;
CREATE TABLE `redeemedgift` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `giftCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessoryId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessoryName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessoryImage` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pointsRedeemed` int NOT NULL,
  `redeemedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RedeemedGift_giftCode_key` (`giftCode`),
  KEY `RedeemedGift_giftCode_idx` (`giftCode`),
  KEY `RedeemedGift_customerPhone_idx` (`customerPhone`),
  KEY `RedeemedGift_status_idx` (`status`),
  KEY `RedeemedGift_customerId_fkey` (`customerId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `registereddevice`
DROP TABLE IF EXISTS `registereddevice`;
CREATE TABLE `registereddevice` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imei` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerEmail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchaseInvoiceCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchaseDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warrantyExpiryDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchasePrice` double NOT NULL DEFAULT '0',
  `repairHistoryCodes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RegisteredDevice_imei_key` (`imei`),
  KEY `RegisteredDevice_imei_idx` (`imei`),
  KEY `RegisteredDevice_customerPhone_idx` (`customerPhone`),
  KEY `RegisteredDevice_customerId_fkey` (`customerId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairbooking`
DROP TABLE IF EXISTS `repairbooking`;
CREATE TABLE `repairbooking` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bookingCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceModel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentTime` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ticketCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RepairBooking_bookingCode_key` (`bookingCode`),
  KEY `RepairBooking_bookingCode_idx` (`bookingCode`),
  KEY `RepairBooking_customerPhone_idx` (`customerPhone`),
  KEY `RepairBooking_status_idx` (`status`),
  KEY `RepairBooking_appointmentDate_idx` (`appointmentDate`),
  KEY `RepairBooking_customerId_fkey` (`customerId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairservice`
DROP TABLE IF EXISTS `repairservice`;
CREATE TABLE `repairservice` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceBrand` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Apple',
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
  KEY `RepairService_deviceBrand_idx` (`deviceBrand`),
  KEY `RepairService_category_idx` (`category`),
  KEY `RepairService_isActive_idx` (`isActive`),
  KEY `RepairService_isFeatured_idx` (`isFeatured`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairstatushistory`
DROP TABLE IF EXISTS `repairstatushistory`;
CREATE TABLE `repairstatushistory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statusLabel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `updatedBy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RepairStatusHistory_ticketCode_idx` (`ticketCode`),
  KEY `RepairStatusHistory_status_idx` (`status`),
  KEY `RepairStatusHistory_createdAt_idx` (`createdAt`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairticket`
DROP TABLE IF EXISTS `repairticket`;
CREATE TABLE `repairticket` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceModel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imeiOrSerial` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unlockPasscode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appearanceCondition` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessoriesIncluded` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `issueDescription` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `technicianNotes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `statusHistory` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `partsUsed` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `laborFee` double NOT NULL DEFAULT '0',
  `totalAmount` double NOT NULL DEFAULT '0',
  `estimatedDeliveryDate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receivedAt` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deliveredAt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technicianId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technicianName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warrantyPeriod` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `assignedBy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deadlineMinutes` int DEFAULT '60',
  `deadlineTime` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RepairTicket_ticketCode_key` (`ticketCode`),
  KEY `RepairTicket_status_idx` (`status`),
  KEY `RepairTicket_customerPhone_idx` (`customerPhone`),
  KEY `RepairTicket_imeiOrSerial_idx` (`imeiOrSerial`),
  KEY `RepairTicket_technicianId_idx` (`technicianId`),
  KEY `RepairTicket_createdAt_idx` (`createdAt`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `repairticketpart`
DROP TABLE IF EXISTS `repairticketpart`;
CREATE TABLE `repairticketpart` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sparePartId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unitPrice` double NOT NULL,
  `warrantyMonths` int NOT NULL DEFAULT '6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RepairTicketPart_ticketCode_idx` (`ticketCode`),
  KEY `RepairTicketPart_sparePartId_idx` (`sparePartId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sparepart`
DROP TABLE IF EXISTS `sparepart`;
CREATE TABLE `sparepart` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `compatibleModels` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `costPrice` double NOT NULL,
  `retailRepairPrice` double NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cái',
  `warrantyMonths` int NOT NULL DEFAULT '6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SparePart_barcode_key` (`barcode`),
  KEY `SparePart_category_idx` (`category`),
  KEY `SparePart_barcode_idx` (`barcode`),
  KEY `SparePart_stock_idx` (`stock`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `storebranch`
DROP TABLE IF EXISTS `storebranch`;
CREATE TABLE `storebranch` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TP. Hồ Chí Minh',
  `openingHours` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '08:00 - 21:30',
  `mapUrl` text COLLATE utf8mb4_unicode_ci,
  `isMainBranch` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `StoreBranch_code_key` (`code`),
  KEY `StoreBranch_code_idx` (`code`),
  KEY `StoreBranch_isActive_idx` (`isActive`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `supplierorder`
DROP TABLE IF EXISTS `supplierorder`;
CREATE TABLE `supplierorder` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemsSummary` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalAmount` double NOT NULL,
  `paidAmount` double NOT NULL,
  `debtAmount` double NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `importedImeis` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SupplierOrder_orderCode_key` (`orderCode`),
  KEY `SupplierOrder_supplierId_idx` (`supplierId`),
  KEY `SupplierOrder_date_idx` (`date`),
  KEY `SupplierOrder_status_idx` (`status`),
  KEY `SupplierOrder_createdAt_idx` (`createdAt`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `supplierorderitem`
DROP TABLE IF EXISTS `supplierorderitem`;
CREATE TABLE `supplierorderitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  KEY `SupplierOrderItem_imei_idx` (`imei`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `user`
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cashier',
  `avatar` longtext COLLATE utf8mb4_unicode_ci,
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `warrantyclaim`
DROP TABLE IF EXISTS `warrantyclaim`;
CREATE TABLE `warrantyclaim` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imeiOrSerial` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerEmail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issueDescription` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `resolutionNotes` text COLLATE utf8mb4_unicode_ci,
  `resolvedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `WarrantyClaim_claimCode_key` (`claimCode`),
  KEY `WarrantyClaim_claimCode_idx` (`claimCode`),
  KEY `WarrantyClaim_imeiOrSerial_idx` (`imeiOrSerial`),
  KEY `WarrantyClaim_customerPhone_idx` (`customerPhone`),
  KEY `WarrantyClaim_status_idx` (`status`),
  KEY `WarrantyClaim_customerId_fkey` (`customerId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
