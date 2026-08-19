-- Align OrganizationLimit.count with live Board rows.
-- Pro creates did not increment this counter until the board-limits hardening,
-- so stored count could sit below the actual board count and the Free cap
-- could be bypassed after a downgrade.

UPDATE "OrganizationLimit" AS ol
SET
    "count" = (
        SELECT COUNT(*)::integer
        FROM "Board" AS b
        WHERE b."orgId" = ol."orgId"
    ),
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "OrganizationLimit" ("id", "orgId", "count", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, b."orgId", COUNT(*)::integer, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" AS b
WHERE NOT EXISTS (
    SELECT 1
    FROM "OrganizationLimit" AS ol
    WHERE ol."orgId" = b."orgId"
)
GROUP BY b."orgId";
