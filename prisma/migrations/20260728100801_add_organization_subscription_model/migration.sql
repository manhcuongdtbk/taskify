-- CreateTable
CREATE TABLE "OrganizationSubscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_current_period_end" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSubscription_orgId_key" ON "OrganizationSubscription"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSubscription_stripe_customer_id_key" ON "OrganizationSubscription"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSubscription_stripe_subscription_id_key" ON "OrganizationSubscription"("stripe_subscription_id");
