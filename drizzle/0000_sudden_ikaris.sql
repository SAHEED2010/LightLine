CREATE TYPE "public"."complaint_category" AS ENUM('METER', 'BILLING', 'SERVICE_INTERRUPTION', 'DISCONNECTION', 'VOLTAGE', 'DELAY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."complaint_priority" AS ENUM('NORMAL', 'HIGH', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."complaint_source" AS ENUM('VOICE', 'OPERATOR', 'DEMO');--> statement-breakpoint
CREATE TYPE "public"."complaint_status" AS ENUM('OPEN', 'REVIEWING', 'RESOLVED', 'ESCALATED');--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" bigint GENERATED ALWAYS AS IDENTITY (sequence name "complaints_ticket_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ticket_id" text GENERATED ALWAYS AS ('LL-' || lpad(ticket_number::text, greatest(4, length(ticket_number::text)), '0')) STORED NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"caller_phone" varchar(32),
	"customer_account" varchar(100),
	"meter_number" varchar(100),
	"category" "complaint_category" NOT NULL,
	"description" text NOT NULL,
	"location" varchar(500) NOT NULL,
	"priority" "complaint_priority" DEFAULT 'NORMAL' NOT NULL,
	"status" "complaint_status" DEFAULT 'OPEN' NOT NULL,
	"source" "complaint_source" DEFAULT 'VOICE' NOT NULL,
	"provider_call_id" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "complaints_ticket_number_unique" UNIQUE("ticket_number"),
	CONSTRAINT "complaints_ticket_id_unique" UNIQUE("ticket_id"),
	CONSTRAINT "complaints_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "complaints_description_length" CHECK (char_length(btrim("complaints"."description")) between 1 and 4000),
	CONSTRAINT "complaints_location_length" CHECK (char_length(btrim("complaints"."location")) between 1 and 500),
	CONSTRAINT "complaints_request_hash_format" CHECK ("complaints"."request_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "complaints_idempotency_key_format" CHECK ("complaints"."idempotency_key" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$')
);
--> statement-breakpoint
CREATE INDEX "complaints_created_at_idx" ON "complaints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "complaints_status_idx" ON "complaints" USING btree ("status");