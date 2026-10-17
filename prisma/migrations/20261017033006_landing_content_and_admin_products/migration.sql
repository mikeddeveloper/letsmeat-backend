-- CreateTable
CREATE TABLE "landing_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "heroEyebrow" TEXT NOT NULL DEFAULT 'The butcher''s table, online',
    "heroHeadline" TEXT NOT NULL DEFAULT 'Choose your cut, buy it by the kilo.',
    "heroSubheadline" TEXT NOT NULL DEFAULT 'Browse by species, click the exact cut off a real diagram, choose fresh or frozen — priced per kilogram, tracked from supplier to your door.',
    "heroCtaLabel" TEXT NOT NULL DEFAULT 'Start shopping',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryLabel" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "imageUrl" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'in_stock',
    "isCutOfTheDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_products_pkey" PRIMARY KEY ("id")
);
