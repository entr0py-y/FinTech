import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "INVESTOR") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { founderId } = body;

        if (!founderId) {
            return new NextResponse("Missing founderId", { status: 400 });
        }

        const investorId = session.user.id;

        // Check if a request already exists
        const existingRequest = await prisma.dataRoomAccess.findUnique({
            where: {
                investorId_founderId: {
                    investorId,
                    founderId,
                },
            },
        });

        if (existingRequest) {
            return new NextResponse("Request already exists", { status: 400 });
        }

        const dataRoomAccess = await prisma.dataRoomAccess.create({
            data: {
                investorId,
                founderId,
                status: "PENDING",
            },
        });

        return NextResponse.json(dataRoomAccess);
    } catch (error) {
        console.error("[VDR_REQUEST_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
