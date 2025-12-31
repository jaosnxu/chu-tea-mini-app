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
ALTER TABLE `iiko_config` ADD `storeId` int;--> statement-breakpoint
ALTER TABLE `iiko_config` ADD `configName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `iiko_config` ADD `autoSyncMenu` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `iiko_config` ADD `syncIntervalMinutes` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `iiko_config` ADD `maxRequestsPerMinute` int DEFAULT 60;--> statement-breakpoint
ALTER TABLE `iiko_config` ADD `lastRequestAt` timestamp;--> statement-breakpoint
ALTER TABLE `iiko_config` ADD `requestCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `iiko_menu_sync` ADD `configId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `iiko_menu_sync` ADD `storeId` int;--> statement-breakpoint
ALTER TABLE `iiko_menu_sync` ADD `iikoCategoryName` varchar(255);--> statement-breakpoint
ALTER TABLE `iiko_menu_sync` ADD `productData` text;--> statement-breakpoint
ALTER TABLE `iiko_menu_sync` ADD `syncStatus` enum('success','failed','pending') DEFAULT 'success' NOT NULL;