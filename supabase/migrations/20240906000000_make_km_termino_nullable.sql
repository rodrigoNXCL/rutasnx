-- Make km_termino nullable (it's set when the day ends)
ALTER TABLE viajes
ALTER COLUMN km_termino DROP NOT NULL;
