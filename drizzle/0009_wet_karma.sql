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
