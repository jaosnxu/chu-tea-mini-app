CREATE TABLE `influencer_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`coverImage` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('draft','active','paused','ended') NOT NULL DEFAULT 'draft',
	`commissionConfig` json NOT NULL,
	`taskRequirements` json,
	`minInfluencerLevel` enum('bronze','silver','gold','diamond') DEFAULT 'bronze',
	`totalParticipants` int DEFAULT 0,
	`totalOrders` int DEFAULT 0,
	`totalRevenue` decimal(10,2) DEFAULT '0.00',
	`totalCommission` decimal(10,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `influencer_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencer_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`orderId` int,
	`earningType` enum('commission','bonus','referral') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`orderAmount` decimal(10,2),
	`commissionRate` decimal(5,2),
	`status` enum('pending','confirmed','paid') NOT NULL DEFAULT 'pending',
	`settledAt` timestamp,
	`withdrawalId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencer_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencer_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','in_progress','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
	`currentOrders` int DEFAULT 0,
	`currentRevenue` decimal(10,2) DEFAULT '0.00',
	`submittedContent` text,
	`submittedAt` timestamp,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `influencer_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `link_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`influencerId` int NOT NULL,
	`campaignId` int,
	`linkCode` varchar(32) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`referer` text,
	`country` varchar(64),
	`city` varchar(128),
	`deviceType` enum('desktop','mobile','tablet'),
	`platform` varchar(64),
	`isConverted` boolean DEFAULT false,
	`orderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `link_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_attribution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`influencerId` int NOT NULL,
	`campaignId` int,
	`linkCode` varchar(32) NOT NULL,
	`clickId` int,
	`orderAmount` decimal(10,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`attributionModel` enum('first_click','last_click','linear') DEFAULT 'last_click',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_attribution_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_attribution_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `withdrawal_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`withdrawalMethod` enum('bank_card','alipay','wechat','paypal') NOT NULL,
	`accountInfo` json NOT NULL,
	`status` enum('pending','processing','completed','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`transactionId` varchar(128),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `withdrawal_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isInfluencer` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `influencerLevel` enum('bronze','silver','gold','diamond') DEFAULT 'bronze';--> statement-breakpoint
ALTER TABLE `users` ADD `influencerCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `totalEarnings` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `availableBalance` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `totalWithdrawn` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `followerCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `conversionRate` decimal(5,2) DEFAULT '0.00';