ALTER TABLE "Operator" ADD COLUMN "name" TEXT;

UPDATE "Operator"
SET "name" = COALESCE(
  NULLIF(split_part((SELECT "email" FROM "UserAccount" WHERE "UserAccount"."id" = "Operator"."userId"), '@', 1), ''),
  'Operador'
);

ALTER TABLE "Operator" ALTER COLUMN "name" SET NOT NULL;
