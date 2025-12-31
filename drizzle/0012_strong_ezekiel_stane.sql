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
