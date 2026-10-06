import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currencies = await prisma.currency.findMany();
  const sorted = currencies.sort((a, b) => {
    if (a.status !== b.status) return a.status === "base" ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
  return NextResponse.json(sorted);
}
