-- Custom SQL migration file, put your code below! --
INSERT INTO locations (name, code, description) VALUES ('London', 'LDN', 'London region and offices nearby such as Reading');
INSERT INTO locations (name, code, description) VALUES ('Birmingham', 'BIRM', 'Birmingham and the Midlands');
INSERT INTO locations (name, code, description) VALUES ('Manchester', 'MANC', 'Manchester and the North West');

ALTER TABLE "prayer_times" ADD CONSTRAINT "prayer_times_location_id_date_uni" UNIQUE ("date", "location_id");