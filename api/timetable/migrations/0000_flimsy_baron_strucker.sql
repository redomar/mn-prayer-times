CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "prayer_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" serial NOT NULL,
	"date" varchar(10) NOT NULL,
	"fajr" varchar(5),
	"fajr_jamat" varchar(5),
	"dhuhr" varchar(5),
	"dhuhr_jamat" varchar(5),
	"asr" varchar(5),
	"asr2" varchar(5),
	"asr_jamat" varchar(5),
	"maghrib" varchar(5),
	"maghrib_jamat" varchar(5),
	"isha" varchar(5),
	"isha_jamat" varchar(5),
	"sunrise" varchar(5)
);
--> statement-breakpoint
ALTER TABLE "prayer_times" ADD CONSTRAINT "prayer_times_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;