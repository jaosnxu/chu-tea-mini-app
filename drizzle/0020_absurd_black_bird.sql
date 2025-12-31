ALTER TABLE `marketingTriggers` ADD `groupTag` varchar(64);--> statement-breakpoint
ALTER TABLE `marketingTriggers` ADD `budget` decimal(12,2);--> statement-breakpoint
ALTER TABLE `marketingTriggers` ADD `spent` decimal(12,2) DEFAULT '0.00';