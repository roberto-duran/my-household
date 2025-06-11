export default `CREATE TABLE \`budget_categories\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`limit\` real NOT NULL,
	\`spent\` real DEFAULT 0,
	\`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	\`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`budget_categories_name_unique\` ON \`budget_categories\` (\`name\`);--> statement-breakpoint
CREATE TABLE \`expenses\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`amount\` real NOT NULL,
	\`category\` text NOT NULL,
	\`due_date\` text NOT NULL,
	\`is_paid\` integer DEFAULT false,
	\`is_recurring\` integer DEFAULT false,
	\`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	\`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE \`financial_settings\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`monthly_income\` real NOT NULL,
	\`savings_goal\` real NOT NULL,
	\`current_savings\` real DEFAULT 0,
	\`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	\`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE \`grocery_items\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`list_id\` text,
	\`name\` text NOT NULL,
	\`quantity\` integer NOT NULL,
	\`price_per_unit\` real NOT NULL,
	\`total_cost\` real NOT NULL,
	\`is_purchased\` integer DEFAULT false,
	\`store_location\` text,
	\`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	\`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (\`list_id\`) REFERENCES \`grocery_lists\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE \`grocery_lists\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`total_cost\` real DEFAULT 0,
	\`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	\`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE \`price_history\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`item_id\` text,
	\`price\` real NOT NULL,
	\`date\` text NOT NULL,
	\`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (\`item_id\`) REFERENCES \`grocery_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
);`; 