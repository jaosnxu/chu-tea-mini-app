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
