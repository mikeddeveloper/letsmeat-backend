import "dotenv/config";
import { PrismaClient, type Customer, type Supplier } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";
import { catalogCategories } from "./catalogData";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedSuperAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? "Super Admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in .env before seeding.");
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, role: "Super Admin" },
    create: { email, passwordHash, name, role: "Super Admin" },
  });
  console.log(`  Super admin: ${admin.email}`);
}

async function seedTeam() {
  const placeholderHash = await hashPassword(crypto.randomUUID());
  const team = [
    { name: "Amaka Johnson", email: "amaka.johnson@letsmeat.app", role: "Catalog Manager", lastActiveAt: new Date(Date.now() - 2 * 60 * 60_000) },
    { name: "Ibrahim Musa", email: "ibrahim.musa@letsmeat.app", role: "Support Lead", lastActiveAt: new Date(Date.now() - 10 * 60_000) },
    { name: "Chioma Nwankwo", email: "chioma.nwankwo@letsmeat.app", role: "Finance Admin", lastActiveAt: new Date(Date.now() - 24 * 60 * 60_000) },
  ];
  for (const member of team) {
    await prisma.adminUser.upsert({
      where: { email: member.email },
      update: { name: member.name, role: member.role, lastActiveAt: member.lastActiveAt },
      create: { ...member, passwordHash: placeholderHash },
    });
  }
  console.log(`  Team members: ${team.length}`);
}

async function seedCustomers(): Promise<Record<string, Customer>> {
  const rows = [
    { name: "Ada Bello", email: "ada.bello@gmail.com", city: "Lagos", status: "active" as const, joinedAt: new Date("2025-01-18") },
    { name: "Tunde Balogun", email: "tunde.b@yahoo.com", city: "Lagos", status: "active" as const, joinedAt: new Date("2025-11-02") },
    { name: "Ngozi Eze", email: "ngozi.eze@outlook.com", city: "Enugu", status: "active" as const, joinedAt: new Date("2024-08-30") },
    { name: "Femi Adeyemi", email: "femi.a@gmail.com", city: "Ibadan", status: "active" as const, joinedAt: new Date("2026-09-02") },
    { name: "Chiamaka Obi", email: "chiamaka.obi@gmail.com", city: "Port Harcourt", status: "suspended" as const, joinedAt: new Date("2025-04-14") },
    { name: "Bashir Yusuf", email: "bashir.y@gmail.com", city: "Kano", status: "active" as const, joinedAt: new Date("2025-06-21") },
    { name: "Grace Okon", email: "grace.okon@gmail.com", city: "Abuja", status: "active" as const, joinedAt: new Date("2024-12-09") },
    { name: "Kelechi Nwosu", email: "kelechi.n@gmail.com", city: "Lagos", status: "active" as const, joinedAt: new Date("2026-07-11") },
  ];
  const byName: Record<string, Customer> = {};
  for (const row of rows) {
    byName[row.name] = await prisma.customer.upsert({ where: { email: row.email }, update: row, create: row });
  }
  console.log(`  Customers: ${rows.length}`);
  return byName;
}

async function seedSuppliers(): Promise<Record<string, Supplier>> {
  const rows = [
    { name: "Sunrise Butchery", email: "contact@sunrisebutchery.ng", categories: ["Poultry", "Red Meat"], city: "Lagos", status: "active" as const, rating: 4.8, joinedAt: new Date("2024-11-05") },
    { name: "Coastal Fish Market", email: "contact@coastalfish.ng", categories: ["Seafood", "Fish"], city: "Lagos", status: "active" as const, rating: 4.6, joinedAt: new Date("2024-12-19") },
    { name: "Northern Livestock Co.", email: "contact@northernlivestock.ng", categories: ["Red Meat"], city: "Kano", status: "pending" as const, rating: null, joinedAt: new Date("2026-09-15") },
    { name: "Green Valley Poultry", email: "contact@greenvalleypoultry.ng", categories: ["Poultry"], city: "Ibadan", status: "active" as const, rating: 4.5, joinedAt: new Date("2025-03-22") },
    { name: "Delta Seafoods", email: "contact@deltaseafoods.ng", categories: ["Seafood"], city: "Port Harcourt", status: "active" as const, rating: 4.7, joinedAt: new Date("2025-02-08") },
    { name: "Highland Farms", email: "contact@highlandfarms.ng", categories: ["Red Meat", "Organ / Offals"], city: "Jos", status: "pending" as const, rating: null, joinedAt: new Date("2026-09-18") },
  ];
  const byName: Record<string, Supplier> = {};
  for (const row of rows) {
    byName[row.name] = await prisma.supplier.upsert({ where: { email: row.email }, update: row, create: row });
  }
  console.log(`  Suppliers: ${rows.length}`);
  return byName;
}

async function seedVerification(suppliers: Record<string, Supplier>) {
  const rows = [
    {
      supplier: "Northern Livestock Co.",
      ninCheck: "pass" as const,
      faceCheck: "pass" as const,
      cacCheck: "pass" as const,
      bankCheck: "pass" as const,
      failureReason: null,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60_000),
    },
    {
      supplier: "Highland Farms",
      ninCheck: "pass" as const,
      faceCheck: "pass" as const,
      cacCheck: "fail" as const,
      bankCheck: "pass" as const,
      failureReason: "CAC director name does not match owner",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60_000),
    },
  ];
  for (const row of rows) {
    const supplier = suppliers[row.supplier];
    await prisma.verificationSubmission.upsert({
      where: { supplierId: supplier.id },
      update: row.failureReason === null ? { ninCheck: row.ninCheck, faceCheck: row.faceCheck, cacCheck: row.cacCheck, bankCheck: row.bankCheck, failureReason: null } : { ninCheck: row.ninCheck, faceCheck: row.faceCheck, cacCheck: row.cacCheck, bankCheck: row.bankCheck, failureReason: row.failureReason },
      create: {
        supplierId: supplier.id,
        ninCheck: row.ninCheck,
        faceCheck: row.faceCheck,
        cacCheck: row.cacCheck,
        bankCheck: row.bankCheck,
        failureReason: row.failureReason,
        submittedAt: row.submittedAt,
      },
    });
  }
  console.log(`  Verification submissions: ${rows.length}`);
}

async function seedOrders(customers: Record<string, Customer>, suppliers: Record<string, Supplier>) {
  const rows = [
    { ref: "#LM-5872", customer: "Ada Bello", supplier: "Sunrise Butchery", itemsSummary: "Goat Meat (Leg) · 3.2kg", totalAmount: 2080000, status: "pending" as const, placedAt: new Date("2026-09-21T09:12:00Z") },
    { ref: "#LM-5871", customer: "Grace Okon", supplier: "Coastal Fish Market", itemsSummary: "Croaker Fish · 2.0kg", totalAmount: 1760000, status: "in_progress" as const, placedAt: new Date("2026-09-21T08:44:00Z") },
    { ref: "#LM-5870", customer: "Tunde Balogun", supplier: "Sunrise Butchery", itemsSummary: "Chicken (Whole) · 1.8kg", totalAmount: 990000, status: "delivered" as const, placedAt: new Date("2026-09-20T18:02:00Z") },
    { ref: "#LM-5869", customer: "Ngozi Eze", supplier: "Sunrise Butchery", itemsSummary: "Beef Sirloin · 4.0kg", totalAmount: 3400000, status: "pending" as const, placedAt: new Date("2026-09-21T07:58:00Z") },
    { ref: "#LM-5868", customer: "Femi Adeyemi", supplier: "Green Valley Poultry", itemsSummary: "Turkey Breast · 2.5kg", totalAmount: 1625000, status: "in_progress" as const, placedAt: new Date("2026-09-20T16:30:00Z") },
    { ref: "#LM-5867", customer: "Bashir Yusuf", supplier: "Delta Seafoods", itemsSummary: "Tiger Prawns · 1.2kg", totalAmount: 1560000, status: "delivered" as const, placedAt: new Date("2026-09-20T14:11:00Z") },
    { ref: "#LM-4821", customer: "Kelechi Nwosu", supplier: "Sunrise Butchery", itemsSummary: "Goat Meat (Leg), Croaker Fish", totalAmount: 1240000, status: "delivered" as const, placedAt: new Date("2026-09-20T10:32:00Z") },
    { ref: "#LM-5866", customer: "Chiamaka Obi", supplier: "Northern Livestock Co.", itemsSummary: "Beef Brisket · 3.0kg", totalAmount: 2760000, status: "cancelled" as const, placedAt: new Date("2026-09-19T19:45:00Z") },
    { ref: "#LM-5865", customer: "Ada Bello", supplier: "Coastal Fish Market", itemsSummary: "Croaker Fish · 1.5kg", totalAmount: 1320000, status: "delivered" as const, placedAt: new Date("2026-09-19T13:20:00Z") },
    { ref: "#LM-5864", customer: "Grace Okon", supplier: "Sunrise Butchery", itemsSummary: "Pork Belly · 2.0kg", totalAmount: 1560000, status: "cancelled" as const, placedAt: new Date("2026-09-19T11:05:00Z") },
    { ref: "#LM-5863", customer: "Bashir Yusuf", supplier: "Highland Farms", itemsSummary: "Goat Shoulder · 2.5kg", totalAmount: 1550000, status: "pending" as const, placedAt: new Date("2026-09-21T06:40:00Z") },
    { ref: "#LM-5862", customer: "Ngozi Eze", supplier: "Green Valley Poultry", itemsSummary: "Chicken Wings · 3.0kg", totalAmount: 1350000, status: "delivered" as const, placedAt: new Date("2026-09-18T15:52:00Z") },
  ];
  for (const row of rows) {
    const { customer, supplier, ...data } = row;
    await prisma.order.upsert({
      where: { ref: row.ref },
      update: { ...data, customerId: customers[customer].id, supplierId: suppliers[supplier].id },
      create: { ...data, customerId: customers[customer].id, supplierId: suppliers[supplier].id },
    });
  }
  console.log(`  Orders: ${rows.length}`);
}

async function seedSupportTickets(customers: Record<string, Customer>) {
  const rows = [
    { ref: "#TCK-231", subject: "Order arrived with the wrong cut", customer: "Ada Bello", priority: "high" as const, status: "open" as const, createdAt: new Date("2026-09-21T09:40:00Z") },
    { ref: "#TCK-230", subject: "Refund not received after cancellation", customer: "Bashir Yusuf", priority: "high" as const, status: "open" as const, createdAt: new Date("2026-09-21T08:05:00Z") },
    { ref: "#TCK-229", subject: "How do I change my delivery address?", customer: "Grace Okon", priority: "normal" as const, status: "resolved" as const, createdAt: new Date("2026-09-19T14:22:00Z") },
    { ref: "#TCK-228", subject: "My account was suspended, why?", customer: "Chiamaka Obi", priority: "normal" as const, status: "in_progress" as const, createdAt: new Date("2026-09-19T10:10:00Z") },
    { ref: "#TCK-227", subject: "Supplier delivered less weight than ordered", customer: "Femi Adeyemi", priority: "normal" as const, status: "resolved" as const, createdAt: new Date("2026-09-18T12:00:00Z") },
  ];
  for (const row of rows) {
    const { customer, ...data } = row;
    await prisma.supportTicket.upsert({
      where: { ref: row.ref },
      update: { ...data, customerId: customers[customer].id },
      create: { ...data, customerId: customers[customer].id },
    });
  }
  console.log(`  Support tickets: ${rows.length}`);
}

async function seedCurrencies() {
  const rows = [
    { code: "NGN", symbol: "₦", label: "Nigerian Naira", rateToNgn: 1, status: "base" as const },
    { code: "USD", symbol: "$", label: "US Dollar", rateToNgn: 0.00061, status: "live" as const },
    { code: "GBP", symbol: "£", label: "British Pound", rateToNgn: 0.00048, status: "live" as const },
    { code: "EUR", symbol: "€", label: "Euro", rateToNgn: 0.00056, status: "live" as const },
    { code: "CAD", symbol: "C$", label: "Canadian Dollar", rateToNgn: 0.00084, status: "live" as const },
    { code: "GHS", symbol: "₵", label: "Ghanaian Cedi", rateToNgn: 0.0091, status: "live" as const },
  ];
  for (const row of rows) {
    await prisma.currency.upsert({ where: { code: row.code }, update: row, create: row });
  }
  console.log(`  Currencies: ${rows.length}`);
}

async function seedProcessingAdjustments() {
  const types = ["Boneless", "Cleaned", "Cubed", "Deveined", "Diced", "Filleted", "Gutted", "Minced", "Regular Cut", "Shelled", "Sliced", "Smoked", "Whole"];
  for (const processingType of types) {
    await prisma.processingAdjustment.upsert({
      where: { processingType },
      update: {},
      create: { processingType, adjustmentPercent: null },
    });
  }
  console.log(`  Processing adjustments: ${types.length}`);
}

async function seedCampaigns() {
  const rows = [
    { name: "Weekend goat meat promo", audience: "All Lagos customers", status: "live" as const, reach: 4200 },
    { name: "New supplier: Delta Seafoods", audience: "Seafood buyers", status: "sent" as const, reach: 1180 },
    { name: "Ramadan bulk order reminder", audience: "Repeat customers", status: "scheduled" as const, reach: 2600 },
    { name: "Inactive customer win-back", audience: "No order in 60+ days", status: "paused" as const, reach: 940 },
  ];
  for (const row of rows) {
    await prisma.campaign.upsert({ where: { name: row.name }, update: row, create: row });
  }
  console.log(`  Campaigns: ${rows.length}`);
}

async function seedSettings() {
  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, platformName: "LetsMeat", supportEmail: null, baseCurrency: "NGN" },
  });

  const integrations = [
    { name: "Paystack", category: "Payments" },
    { name: "Flutterwave", category: "Payments" },
    { name: "Resend", category: "Transactional email" },
    { name: "Exchange rate feed", category: "Currency conversion" },
  ];
  for (const row of integrations) {
    await prisma.integration.upsert({ where: { name: row.name }, update: row, create: row });
  }
  console.log(`  Settings + integrations: ${integrations.length}`);
}

async function seedCatalog() {
  let categoryCount = 0;
  let animalCount = 0;
  let partCount = 0;

  for (const category of catalogCategories) {
    const categoryRow = await prisma.animalCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: { slug: category.slug, name: category.name, description: category.description },
    });
    categoryCount++;

    for (const animal of category.animals) {
      const animalRow = await prisma.animal.upsert({
        where: { categoryId_slug: { categoryId: categoryRow.id, slug: animal.slug } },
        update: { name: animal.name, description: animal.description },
        create: { categoryId: categoryRow.id, slug: animal.slug, name: animal.name, description: animal.description },
      });
      animalCount++;

      for (const part of animal.parts) {
        const data = {
          name: part.name,
          basePrice: Math.round(part.basePrice * 100), // naira -> kobo
          unit: part.unit,
          conditions: part.conditions,
          processing: part.processing,
          availability: part.availability ?? "in_stock",
        };
        await prisma.part.upsert({
          where: { animalId_slug: { animalId: animalRow.id, slug: part.slug } },
          update: data,
          create: { animalId: animalRow.id, slug: part.slug, ...data },
        });
        partCount++;
      }
    }
  }
  console.log(`  Catalog: ${categoryCount} categories, ${animalCount} animals, ${partCount} parts`);
}

async function main() {
  console.log("Seeding...");
  await seedSuperAdmin();
  await seedTeam();
  const customers = await seedCustomers();
  const suppliers = await seedSuppliers();
  await seedVerification(suppliers);
  await seedOrders(customers, suppliers);
  await seedSupportTickets(customers);
  await seedCurrencies();
  await seedProcessingAdjustments();
  await seedCampaigns();
  await seedSettings();
  await seedCatalog();
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
