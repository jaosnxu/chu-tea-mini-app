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
