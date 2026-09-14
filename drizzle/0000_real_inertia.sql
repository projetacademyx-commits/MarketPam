CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(96) NOT NULL,
	"name" varchar(120) NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(24) NOT NULL,
	"product_slug" varchar(140) NOT NULL,
	"name" varchar(180) NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(24) NOT NULL,
	"email" varchar(180) NOT NULL,
	"full_name" varchar(180) NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" varchar(120) DEFAULT '' NOT NULL,
	"postal_code" varchar(40) DEFAULT '' NOT NULL,
	"country" varchar(120) DEFAULT '' NOT NULL,
	"shipping_method" varchar(60) DEFAULT 'standard' NOT NULL,
	"subtotal" integer NOT NULL,
	"shipping" integer DEFAULT 0 NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"status" varchar(40) DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"name" varchar(180) NOT NULL,
	"brand" varchar(120) DEFAULT 'MarketPam' NOT NULL,
	"category_slug" varchar(96) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stock" integer DEFAULT 25 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"badge" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_slug" varchar(140) NOT NULL,
	"author" varchar(120) NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(180) DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_name" varchar(160) NOT NULL,
	"email" varchar(180) NOT NULL,
	"title" varchar(180) NOT NULL,
	"category_slug" varchar(96) DEFAULT 'home' NOT NULL,
	"condition" varchar(40) DEFAULT 'like-new' NOT NULL,
	"asking_price" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" varchar(40) DEFAULT 'in-review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
