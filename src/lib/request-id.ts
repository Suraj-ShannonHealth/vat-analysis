import { prisma } from "@/lib/prisma";

export type RequestIdKind = "MEDICAL" | "SURGICAL";

/** Map form "Type of Request" to counter key + display suffix */
export function requestIdKindFromType(typeOfRequest: string): {
  kind: RequestIdKind;
  suffix: string;
} {
  const t = typeOfRequest.toLowerCase();
  if (t.includes("surgical")) {
    return { kind: "SURGICAL", suffix: "S" };
  }
  return { kind: "MEDICAL", suffix: "" };
}

/**
 * Allocate next Request # in a transaction.
 * Medical: 1400, 1401, …   Surgical: 1400S, 1401S, …
 * Sequences are independent.
 */
export async function allocateRequestNumber(
  typeOfRequest: string
): Promise<string> {
  const { kind, suffix } = requestIdKindFromType(typeOfRequest);

  const requestNumber = await prisma.$transaction(async (tx) => {
    let row = await tx.requestIdCounter.findUnique({ where: { id: kind } });
    if (!row) {
      row = await tx.requestIdCounter.create({
        data: { id: kind, nextValue: 1400 },
      });
    }
    const n = row.nextValue;
    await tx.requestIdCounter.update({
      where: { id: kind },
      data: { nextValue: n + 1 },
    });
    return `${n}${suffix}`;
  });

  return requestNumber;
}
