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
