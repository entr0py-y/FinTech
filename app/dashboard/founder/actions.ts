"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getFounderVDRData() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "FOUNDER") {
        throw new Error("Unauthorized");
    }

    const documents = await prisma.document.findMany({
        where: { founderId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    const pendingRequests = await prisma.dataRoomAccess.findMany({
        where: {
            founderId: session.user.id,
            status: "PENDING",
        },
        include: {
            investor: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const bids = await prisma.bid.findMany({
        where: { pitch: { founderId: session.user.id } },
        include: { investor: true, pitch: true },
        orderBy: { createdAt: "desc" }
    });

    return { documents, pendingRequests, bids };
}
