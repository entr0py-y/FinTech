import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "FOUNDER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { requestId } = body;

        if (!requestId) {
            return new NextResponse("Missing requestId", { status: 400 });
        }

        // Find the request and verify it belongs to this founder
        const accessRequest = await prisma.dataRoomAccess.findUnique({
            where: {
                id: requestId,
            },
        });

        if (!accessRequest || accessRequest.founderId !== session.user.id) {
            return new NextResponse("Unauthorized or not found", { status: 404 });
        }

        const updatedRequest = await prisma.dataRoomAccess.update({
            where: {
                id: requestId,
            },
            data: {
                status: "APPROVED",
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("[VDR_APPROVE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
