import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [verificationPending, ordersOpen, supportOpen] = await Promise.all([
    prisma.verificationSubmission.count({ where: { decision: null } }),
    prisma.order.count({ where: { status: { in: ["pending", "in_progress"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
  ]);

  return NextResponse.json({ verification: verificationPending, orders: ordersOpen, support: supportOpen });
}
