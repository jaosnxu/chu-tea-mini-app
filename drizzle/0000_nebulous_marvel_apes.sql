CREATE TABLE `adMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slotId` int NOT NULL,
	`type` enum('image','video') NOT NULL DEFAULT 'image',
	`mediaUrl` text NOT NULL,
	`thumbnailUrl` text,
	`linkType` enum('none','product','category','page','external') DEFAULT 'none',
	`linkValue` varchar(256),
	`titleZh` varchar(128),
	`titleRu` varchar(128),
	`titleEn` varchar(128),
	`sortOrder` int NOT NULL DEFAULT 0,
	`startAt` timestamp,
	`endAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`clicks` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adSlots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(64) NOT NULL,
	`nameRu` varchar(64) NOT NULL,
	`nameEn` varchar(64) NOT NULL,
	`position` enum('home_top','home_bottom','menu_banner','mall_banner','popup') NOT NULL,
	`width` int,
	`height` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adSlots_id` PRIMARY KEY(`id`),
	CONSTRAINT `adSlots_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
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
CREATE TABLE `adminRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(64) NOT NULL,
	`nameRu` varchar(64) NOT NULL,
	`nameEn` varchar(64) NOT NULL,
	`permissions` json,
	`description` text,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminRoles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `adminTelegramBindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`telegramChatId` varchar(64) NOT NULL,
	`telegramUsername` varchar(64),
	`notifyNewOrder` boolean NOT NULL DEFAULT true,
	`notifyPaymentFailed` boolean NOT NULL DEFAULT true,
	`notifyLowStock` boolean NOT NULL DEFAULT true,
	`notifySystemAlert` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationCode` varchar(16),
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminTelegramBindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminTelegramBindings_adminUserId_unique` UNIQUE(`adminUserId`)
);
--> statement-breakpoint
CREATE TABLE `adminUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`storeIds` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminUsers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `anomalyAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` enum('fraud','abuse','system','business') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`titleZh` varchar(128) NOT NULL,
	`titleRu` varchar(128) NOT NULL,
	`titleEn` varchar(128) NOT NULL,
	`description` text,
	`relatedUserId` int,
	`relatedOrderId` int,
	`metadata` json,
	`status` enum('open','investigating','resolved','dismissed') NOT NULL DEFAULT 'open',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anomalyAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(32) NOT NULL,
	`nameZh` varchar(64) NOT NULL,
	`nameRu` varchar(64) NOT NULL,
	`nameEn` varchar(64) NOT NULL,
	`category` enum('payment','logistics','pos','notification','other') NOT NULL,
	`config` json,
	`isActive` boolean NOT NULL DEFAULT false,
	`lastTestAt` timestamp,
	`lastTestResult` enum('success','failed'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiConfigs_provider_unique` UNIQUE(`provider`)
);
--> statement-breakpoint
CREATE TABLE `campaignExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(32) NOT NULL,
	`actionResult` json,
	`status` enum('success','failed','skipped') NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignExecutions_id` PRIMARY KEY(`id`)
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
CREATE TABLE `couponApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`requestType` enum('create','modify','batch_issue') NOT NULL,
	`requestData` json,
	`estimatedCost` decimal(12,2),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `couponApprovals_id` PRIMARY KEY(`id`)
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
	`type` enum('fixed','percent','product','gift','buy_one_get_one','free_product') NOT NULL,
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
CREATE TABLE `homeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position` enum('left','right') NOT NULL,
	`entryType` enum('order','mall','coupons','points','member','custom') NOT NULL,
	`iconUrl` text,
	`nameZh` varchar(32),
	`nameRu` varchar(32),
	`nameEn` varchar(32),
	`linkPath` varchar(128),
	`bgColor` varchar(32),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iiko_category_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iiko_group_id` varchar(255) NOT NULL,
	`iiko_group_name` varchar(255) NOT NULL,
	`local_category_id` int NOT NULL,
	`store_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_category_mapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iiko_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int,
	`configName` varchar(255) NOT NULL,
	`apiUrl` varchar(255) NOT NULL DEFAULT 'https://api-ru.iiko.services',
	`apiLogin` varchar(255) NOT NULL,
	`organizationId` varchar(64) NOT NULL,
	`organizationName` varchar(255),
	`terminalGroupId` varchar(64),
	`terminalGroupName` varchar(255),
	`menuRevision` int DEFAULT 0,
	`lastMenuSyncAt` timestamp,
	`autoSyncMenu` boolean NOT NULL DEFAULT false,
	`syncIntervalMinutes` int DEFAULT 30,
	`isActive` boolean NOT NULL DEFAULT true,
	`accessToken` text,
	`tokenExpiresAt` timestamp,
	`maxRequestsPerMinute` int DEFAULT 60,
	`lastRequestAt` timestamp,
	`requestCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iiko_menu_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`storeId` int,
	`iikoProductId` varchar(64) NOT NULL,
	`iikoProductName` varchar(255) NOT NULL,
	`iikoCategoryId` varchar(64),
	`iikoCategoryName` varchar(255),
	`localProductId` int,
	`productData` text,
	`price` decimal(10,2),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isInStopList` boolean NOT NULL DEFAULT false,
	`lastSyncAt` timestamp NOT NULL,
	`syncStatus` enum('success','failed','pending') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_menu_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iiko_order_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`storeId` int NOT NULL,
	`orderData` text NOT NULL,
	`queueStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`priority` int NOT NULL DEFAULT 0,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`processedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_order_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iiko_order_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`iikoOrderId` varchar(64),
	`iikoExternalNumber` varchar(64),
	`syncStatus` enum('pending','syncing','success','failed') NOT NULL DEFAULT 'pending',
	`syncAttempts` int NOT NULL DEFAULT 0,
	`lastSyncAt` timestamp,
	`errorMessage` text,
	`errorCode` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_order_sync_id` PRIMARY KEY(`id`)
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
CREATE TABLE `marketingCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(128) NOT NULL,
	`nameRu` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`type` enum('auto_coupon','points_bonus','member_upgrade','birthday','recall','custom') NOT NULL,
	`triggerType` enum('event','schedule','manual') NOT NULL,
	`triggerCondition` json,
	`actionType` enum('send_coupon','add_points','send_notification','upgrade_member') NOT NULL,
	`actionConfig` json,
	`priority` int NOT NULL DEFAULT 0,
	`silencePeriod` int DEFAULT 0,
	`budget` decimal(12,2),
	`usedBudget` decimal(12,2) DEFAULT '0.00',
	`maxExecutions` int,
	`executionCount` int NOT NULL DEFAULT 0,
	`startAt` timestamp,
	`endAt` timestamp,
	`status` enum('draft','pending','active','paused','completed','cancelled') NOT NULL DEFAULT 'draft',
	`createdBy` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingCampaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketingCampaigns_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `marketingTriggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`triggerType` enum('user_register','first_order','order_amount','user_inactive','user_churn','user_birthday','birthday','time_based','scheduled_time') NOT NULL,
	`conditions` json NOT NULL,
	`action` enum('send_coupon','send_notification','add_points') NOT NULL,
	`actionConfig` json NOT NULL,
	`groupTag` varchar(64),
	`budget` decimal(12,2),
	`spent` decimal(12,2) DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`executionCount` int NOT NULL DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingTriggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberLevelConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` enum('normal','silver','gold','diamond') NOT NULL,
	`nameZh` varchar(32) NOT NULL,
	`nameRu` varchar(32) NOT NULL,
	`nameEn` varchar(32) NOT NULL,
	`minSpent` decimal(12,2) NOT NULL,
	`pointsMultiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
	`discountRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`birthdayGiftCouponId` int,
	`upgradeGiftCouponId` int,
	`benefits` json,
	`iconUrl` text,
	`badgeColor` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberLevelConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberLevelConfigs_level_unique` UNIQUE(`level`)
);
--> statement-breakpoint
CREATE TABLE `memberTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT '#3b82f6',
	`type` enum('user','store','system') NOT NULL DEFAULT 'user',
	`storeId` int,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`nameZh` varchar(128) NOT NULL,
	`nameRu` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`triggerEvent` enum('new_order','order_paid','order_shipped','order_completed','order_cancelled','payment_failed','payment_refunded','low_stock','out_of_stock','new_user','user_birthday','coupon_expiring','points_expiring','system_alert') NOT NULL,
	`channels` json NOT NULL,
	`recipientType` enum('admin','store_manager','user','custom') NOT NULL,
	`recipientConfig` json,
	`conditions` json,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`nameZh` varchar(128) NOT NULL,
	`nameRu` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`category` enum('order','payment','inventory','user','marketing','system') NOT NULL,
	`titleZh` varchar(256) NOT NULL,
	`titleRu` varchar(256) NOT NULL,
	`titleEn` varchar(256) NOT NULL,
	`contentZh` text NOT NULL,
	`contentRu` text NOT NULL,
	`contentEn` text NOT NULL,
	`variables` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationTemplates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int,
	`ruleId` int,
	`recipientType` enum('admin','user') NOT NULL,
	`recipientId` int NOT NULL,
	`channel` enum('system','telegram','email','sms') NOT NULL,
	`titleZh` varchar(256) NOT NULL,
	`titleRu` varchar(256) NOT NULL,
	`titleEn` varchar(256) NOT NULL,
	`contentZh` text NOT NULL,
	`contentRu` text NOT NULL,
	`contentEn` text NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`relatedType` varchar(32),
	`relatedId` int,
	`metadata` json,
	`status` enum('pending','sent','delivered','failed','read') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`readAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`module` varchar(32) NOT NULL,
	`action` varchar(32) NOT NULL,
	`targetType` varchar(32),
	`targetId` int,
	`beforeData` json,
	`afterData` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operationLogs_id` PRIMARY KEY(`id`)
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
CREATE TABLE `orderReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`storeId` int NOT NULL,
	`overallRating` int NOT NULL,
	`tasteRating` int,
	`serviceRating` int,
	`speedRating` int,
	`packagingRating` int,
	`content` text,
	`images` json,
	`tags` json,
	`reply` text,
	`repliedAt` timestamp,
	`repliedBy` int,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`isVisible` boolean NOT NULL DEFAULT true,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`pickupCode` varchar(5),
	`orderSource` enum('delivery','store','telegram') NOT NULL DEFAULT 'telegram',
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
	`campaignId` varchar(64),
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
CREATE TABLE `phoneVerificationCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(32) NOT NULL,
	`code` varchar(6) NOT NULL,
	`purpose` enum('register','login','change_phone','bind_phone') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phoneVerificationCodes_id` PRIMARY KEY(`id`)
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
CREATE TABLE `pointsRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(64) NOT NULL,
	`nameRu` varchar(64) NOT NULL,
	`nameEn` varchar(64) NOT NULL,
	`ruleType` enum('earn','redeem','expire','bonus') NOT NULL,
	`baseRate` decimal(10,4),
	`memberLevelMultiplier` json,
	`maxPointsPerOrder` int,
	`minOrderAmount` decimal(10,2),
	`expirationDays` int,
	`applicableOrderTypes` json,
	`excludeCategories` json,
	`excludeProducts` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pointsRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `pointsRules_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `product_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key` varchar(64) NOT NULL,
	`name_zh` varchar(128) NOT NULL,
	`name_ru` varchar(128) NOT NULL,
	`name_en` varchar(128) NOT NULL,
	`config_type` enum('sugar','ice','size','topping','other') NOT NULL,
	`config_value` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_config_config_key_unique` UNIQUE(`config_key`)
);
--> statement-breakpoint
CREATE TABLE `product_option_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`config_key` varchar(64) NOT NULL,
	`config_value` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_option_config_id` PRIMARY KEY(`id`)
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
CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentId` int NOT NULL,
	`refundNo` varchar(64) NOT NULL,
	`gatewayRefundId` varchar(128),
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'RUB',
	`status` enum('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
	`reason` text,
	`errorMessage` text,
	`refundedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`),
	CONSTRAINT `refunds_refundNo_unique` UNIQUE(`refundNo`)
);
--> statement-breakpoint
CREATE TABLE `reviewLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('like','dislike') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviewLikes_id` PRIMARY KEY(`id`)
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
CREATE TABLE `telegramBotConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botToken` varchar(128),
	`botUsername` varchar(64),
	`webhookUrl` text,
	`adminChatId` varchar(64),
	`isActive` boolean NOT NULL DEFAULT false,
	`lastTestAt` timestamp,
	`lastTestResult` enum('success','failed'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegramBotConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `triggerExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triggerId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`result` json,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `triggerExecutions_id` PRIMARY KEY(`id`)
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
	`campaignId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCoupons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userMemberTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tagId` int NOT NULL,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userMemberTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`order_status_enabled` boolean NOT NULL DEFAULT true,
	`promotion_enabled` boolean NOT NULL DEFAULT true,
	`system_message_enabled` boolean NOT NULL DEFAULT true,
	`marketing_enabled` boolean NOT NULL DEFAULT false,
	`shipping_enabled` boolean NOT NULL DEFAULT true,
	`channel_telegram` boolean NOT NULL DEFAULT true,
	`channel_email` boolean NOT NULL DEFAULT false,
	`channel_sms` boolean NOT NULL DEFAULT false,
	`quiet_hours_start` varchar(5),
	`quiet_hours_end` varchar(5),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_notification_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `userTagAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tagId` int NOT NULL,
	`assignedBy` enum('system','manual') NOT NULL DEFAULT 'system',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userTagAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameZh` varchar(64) NOT NULL,
	`nameRu` varchar(64) NOT NULL,
	`nameEn` varchar(64) NOT NULL,
	`color` varchar(16),
	`category` enum('behavior','value','lifecycle','preference','custom') NOT NULL,
	`autoAssign` boolean NOT NULL DEFAULT false,
	`assignCondition` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `userTags_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`telegramId` varchar(64),
	`telegramUsername` varchar(128),
	`memberId` varchar(32),
	`name` text,
	`email` varchar(320),
	`phone` varchar(32),
	`phoneVerified` boolean NOT NULL DEFAULT false,
	`birthday` date,
	`city` varchar(128),
	`avatar` text,
	`language` varchar(10) DEFAULT 'ru',
	`loginMethod` varchar(64),
	`profileCompleted` boolean NOT NULL DEFAULT false,
	`role` enum('user','admin','influencer') NOT NULL DEFAULT 'user',
	`memberLevel` enum('normal','silver','gold','diamond') NOT NULL DEFAULT 'normal',
	`totalPoints` int NOT NULL DEFAULT 0,
	`availablePoints` int NOT NULL DEFAULT 0,
	`totalSpent` decimal(12,2) NOT NULL DEFAULT '0.00',
	`referrerId` int,
	`referrerCode` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_telegramId_unique` UNIQUE(`telegramId`),
	CONSTRAINT `users_memberId_unique` UNIQUE(`memberId`),
	CONSTRAINT `users_referrerCode_unique` UNIQUE(`referrerCode`)
);
--> statement-breakpoint
CREATE TABLE `yookassa_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shop_id` varchar(255) NOT NULL,
	`secret_key` text NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `yookassa_config_id` PRIMARY KEY(`id`)
);
