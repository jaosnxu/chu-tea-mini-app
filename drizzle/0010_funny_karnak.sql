CREATE TABLE `yookassa_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shop_id` varchar(255) NOT NULL,
	`secret_key` text NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `yookassa_config_id` PRIMARY KEY(`id`)
);
