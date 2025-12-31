CREATE TABLE `iiko_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiUrl` varchar(255) NOT NULL DEFAULT 'https://api-ru.iiko.services',
	`apiLogin` varchar(255) NOT NULL,
	`organizationId` varchar(64) NOT NULL,
	`organizationName` varchar(255),
	`terminalGroupId` varchar(64),
	`terminalGroupName` varchar(255),
	`menuRevision` int DEFAULT 0,
	`lastMenuSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`accessToken` text,
	`tokenExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iiko_menu_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iikoProductId` varchar(64) NOT NULL,
	`iikoProductName` varchar(255) NOT NULL,
	`iikoCategoryId` varchar(64),
	`localProductId` int,
	`price` decimal(10,2),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isInStopList` boolean NOT NULL DEFAULT false,
	`lastSyncAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iiko_menu_sync_id` PRIMARY KEY(`id`)
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
