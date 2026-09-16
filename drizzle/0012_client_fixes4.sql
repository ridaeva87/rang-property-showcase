UPDATE "property_objects"
SET "description" = 'Помещения свободного назначения', "updated_at" = now()
WHERE "id" IN ('tolbuhina-15-2', 'tolbuhina-19', 'patrisa-lumumby-28b');
--> statement-breakpoint
UPDATE "property_objects"
SET "name" = 'ЖК Толбухина 15/2', "updated_at" = now()
WHERE "id" = 'sale-object-tolbuhina-15-2';
--> statement-breakpoint
WITH ordered AS (
  SELECT "premise_id", "media_id",
    row_number() OVER (
      PARTITION BY "premise_id"
      ORDER BY CASE WHEN "media_id" = 'media-sale-t15-87dbd877fd3fa151d5be' THEN 0 ELSE 1 END, "sort_order", "media_id"
    ) - 1 AS new_order
  FROM "premise_media"
  WHERE "premise_id" = 'sale-apartment-tolbuhina-15-2'
)
UPDATE "premise_media" AS pm
SET "sort_order" = ordered.new_order
FROM ordered
WHERE pm."premise_id" = ordered."premise_id" AND pm."media_id" = ordered."media_id";
