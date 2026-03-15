"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getInvestorVDRData() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "INVESTOR") {
        throw new Error("Unauthorized");
    }

    const investorId = session.user.id;

    // Fetch all founders who have at least one pitch
    const founders = await prisma.user.findMany({
        where: {
            role: "FOUNDER",
            pitches: {
                some: {}
            }
        },
        select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            pitches: {
                take: 1,
                select: {
                    videoUrl: true,
                    pitchDeckUrl: true,
                }
            }
        },
    });

    // Fetch requests made by this investor to map statuses
    const requests = await prisma.dataRoomAccess.findMany({
        where: { investorId },
    });

    // Map founders with their request status
    const foundersWithStatus = founders.map((founder) => {
        const request = requests.find((r) => r.founderId === founder.id);
        return {
            ...founder,
            accessStatus: request ? request.status : null,
        };
    });

    // Fetch approved data rooms along with their documents
    const approvedAccesses = await prisma.dataRoomAccess.findMany({
        where: {
            investorId,
            status: "APPROVED",
        },
        include: {
            founder: {
                include: {
                    documents: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
        },
    });

    const approvedDataRooms = approvedAccesses.map((access) => ({
        founderId: access.founder.id,
        founderName: access.founder.name,
        documents: access.founder.documents,
    }));

    return { founders: foundersWithStatus, approvedDataRooms };
}
