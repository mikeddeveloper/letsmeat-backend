import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await prisma.verificationSubmission.findMany({
    where: { decision: null },
    orderBy: { submittedAt: "asc" },
    include: { supplier: { select: { name: true, city: true } } },
  });

  return NextResponse.json(
    submissions.map((s) => ({
      id: s.id,
      businessName: s.supplier.name,
      location: s.supplier.city,
      submittedAt: s.submittedAt,
      checks: { nin: s.ninCheck, face: s.faceCheck, cac: s.cacCheck, bank: s.bankCheck },
      failureReason: s.failureReason ?? undefined,
    })),
  );
}
