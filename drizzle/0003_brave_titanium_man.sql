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
