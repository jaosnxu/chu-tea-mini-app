CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`province` varchar(64),
	`city` varchar(64),
	`district` varchar(64),
	`address` text NOT NULL,
	`postalCode` varchar(16),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storeId` int,
	`productId` int NOT NULL,
	`skuId` int,
	`quantity` int NOT NULL DEFAULT 1,
	`selectedOptions` json,
	`unitPrice` decimal(10,2) NOT NULL,
	`cartType` enum('tea','mall') NOT NULL DEFAULT 'tea',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iikoId` varchar(64),
	`parentId` int,
	`type` enum('tea','mall') NOT NULL DEFAULT 'tea',
	`nameZh` varchar(128) NOT NULL,
	`nameRu` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`image` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `couponTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(128) NOT NULL,
	`nameRu` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`descriptionZh` text,
	`descriptionRu` text,
	`descriptionEn` text,
	`type` enum('fixed','percent','product','gift') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`minOrderAmount` decimal(10,2) DEFAULT '0.00',
	`maxDiscount` decimal(10,2),
	`applicableProducts` json,
	`applicableCategories` json,
	`applicableStores` json,
	`excludeProducts` json,
	`stackable` boolean NOT NULL DEFAULT false,
	`totalQuantity` int DEFAULT -1,
	`usedQuantity` int NOT NULL DEFAULT 0,
	`perUserLimit` int DEFAULT 1,
	`validDays` int,
	`startAt` timestamp,
	`endAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `couponTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `couponTemplates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `influencerCommissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`influencerId` int NOT NULL,
	`orderId` int NOT NULL,
	`orderAmount` decimal(12,2) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencerCommissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencerLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`influencerId` int NOT NULL,
	`storeId` int,
	`campaignName` varchar(128),
	`shortCode` varchar(32) NOT NULL,
	`clicks` int NOT NULL DEFAULT 0,
	`registrations` int NOT NULL DEFAULT 0,
	`orders` int NOT NULL DEFAULT 0,
	`gmv` decimal(14,2) NOT NULL DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencerLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `influencerLinks_shortCode_unique` UNIQUE(`shortCode`)
);
--> statement-breakpoint
CREATE TABLE `influencers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(128),
	`nameRu` varchar(128),
	`nameEn` varchar(128),
	`avatar` text,
	`bio` text,
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '5.00',
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalRegistrations` int NOT NULL DEFAULT 0,
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalGmv` decimal(14,2) NOT NULL DEFAULT '0.00',
	`totalCommission` decimal(12,2) NOT NULL DEFAULT '0.00',
	`pendingCommission` decimal(12,2) NOT NULL DEFAULT '0.00',
	`withdrawnCommission` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `influencers_id` PRIMARY KEY(`id`),
	CONSTRAINT `influencers_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `influencers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `landingPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`storeId` int,
	`titleZh` varchar(256),
	`titleRu` varchar(256),
	`titleEn` varchar(256),
	`contentZh` text,
	`contentRu` text,
	`contentEn` text,
	`heroImage` text,
	`welcomeCouponId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`views` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landingPages_id` PRIMARY KEY(`id`),
	CONSTRAINT `landingPages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`skuId` int,
	`productSnapshot` json,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`iikoOrderId` varchar(64),
	`userId` int NOT NULL,
	`storeId` int,
	`orderType` enum('tea','mall') NOT NULL DEFAULT 'tea',
	`deliveryType` enum('delivery','pickup') NOT NULL DEFAULT 'delivery',
	`status` enum('pending','paid','preparing','ready','delivering','completed','cancelled','refunding','refunded') NOT NULL DEFAULT 'pending',
	`addressId` int,
	`addressSnapshot` json,
	`pickupTime` timestamp,
	`subtotal` decimal(12,2) NOT NULL,
	`deliveryFee` decimal(10,2) DEFAULT '0.00',
	`discount` decimal(10,2) DEFAULT '0.00',
	`pointsUsed` int DEFAULT 0,
	`pointsDiscount` decimal(10,2) DEFAULT '0.00',
	`couponId` int,
	`couponDiscount` decimal(10,2) DEFAULT '0.00',
	`totalAmount` decimal(12,2) NOT NULL,
	`paidAmount` decimal(12,2) DEFAULT '0.00',
	`paymentMethod` varchar(32),
	`paymentId` varchar(128),
	`paidAt` timestamp,
	`remarkZh` text,
	`remarkRu` text,
	`remarkEn` text,
	`cancelReason` text,
	`cancelledAt` timestamp,
	`completedAt` timestamp,
	`pointsEarned` int DEFAULT 0,
	`referrerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`paymentNo` varchar(64) NOT NULL,
	`gateway` varchar(32) NOT NULL,
	`gatewayPaymentId` varchar(128),
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'RUB',
	`status` enum('pending','processing','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`receiptUrl` text,
	`receiptData` json,
	`errorMessage` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_paymentNo_unique` UNIQUE(`paymentNo`)
);
--> statement-breakpoint
CREATE TABLE `pointsHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earn','redeem','expire','adjust') NOT NULL,
	`points` int NOT NULL,
	`balance` int NOT NULL,
	`orderId` int,
	`descriptionZh` varchar(256),
	`descriptionRu` varchar(256),
	`descriptionEn` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pointsHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productOptionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`optionId` int NOT NULL,
	`iikoModifierId` varchar(64),
	`nameZh` varchar(64) NOT NULL,
	`nameRu` varchar(64) NOT NULL,
	`nameEn` varchar(64) NOT NULL,
	`priceAdjust` decimal(10,2) DEFAULT '0.00',
	`isDefault` boolean DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `productOptionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`groupNameZh` varchar(64) NOT NULL,
	`groupNameRu` varchar(64) NOT NULL,
	`groupNameEn` varchar(64) NOT NULL,
	`groupType` enum('sugar','ice','size','topping','other') NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`isMultiple` boolean NOT NULL DEFAULT false,
	`maxSelect` int DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productSkus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sku` varchar(64) NOT NULL,
	`specNameZh` varchar(128),
	`specNameRu` varchar(128),
	`specNameEn` varchar(128),
	`specValues` json,
	`price` decimal(10,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`image` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productSkus_id` PRIMARY KEY(`id`),
	CONSTRAINT `productSkus_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iikoId` varchar(64),
	`categoryId` int NOT NULL,
	`type` enum('tea','mall') NOT NULL DEFAULT 'tea',
	`code` varchar(64) NOT NULL,
	`nameZh` varchar(256) NOT NULL,
	`nameRu` varchar(256) NOT NULL,
	`nameEn` varchar(256) NOT NULL,
	`descriptionZh` text,
	`descriptionRu` text,
	`descriptionEn` text,
	`image` text,
	`images` json,
	`basePrice` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`pointsEarn` int DEFAULT 0,
	`pointsRedeem` int DEFAULT 0,
	`stock` int DEFAULT 999,
	`salesCount` int DEFAULT 0,
	`isHot` boolean DEFAULT false,
	`isNew` boolean DEFAULT false,
	`isRecommended` boolean DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`carrier` varchar(32) NOT NULL,
	`trackingNo` varchar(64),
	`status` enum('pending','picked','in_transit','out_for_delivery','delivered','failed') NOT NULL DEFAULT 'pending',
	`estimatedDelivery` timestamp,
	`deliveredAt` timestamp,
	`trackingHistory` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iikoId` varchar(64),
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(128) NOT NULL,
	`nameRu` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`addressZh` text,
	`addressRu` text,
	`addressEn` text,
	`phone` varchar(32),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`openTime` varchar(16),
	`closeTime` varchar(16),
	`isOpen` boolean NOT NULL DEFAULT true,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`deliveryRadius` int DEFAULT 5000,
	`minOrderAmount` decimal(10,2) DEFAULT '0.00',
	`deliveryFee` decimal(10,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `systemConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text,
	`descriptionZh` varchar(256),
	`descriptionRu` varchar(256),
	`descriptionEn` varchar(256),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemConfigs_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `userCoupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`status` enum('available','used','expired') NOT NULL DEFAULT 'available',
	`usedOrderId` int,
	`usedAt` timestamp,
	`expireAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCoupons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','influencer') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `telegramId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramUsername` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(10) DEFAULT 'ru';--> statement-breakpoint
ALTER TABLE `users` ADD `memberLevel` enum('normal','silver','gold','diamond') DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalPoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `availablePoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalSpent` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `referrerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `referrerCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_telegramId_unique` UNIQUE(`telegramId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referrerCode_unique` UNIQUE(`referrerCode`);