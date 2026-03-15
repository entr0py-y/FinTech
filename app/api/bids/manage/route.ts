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
        const { bidId, status } = body;

        if (!bidId || (status !== "ACCEPTED" && status !== "REJECTED")) {
            return new NextResponse("Invalid request data", { status: 400 });
        }

        // Verify the Founder owns the pitch associated with this bid
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: { pitch: true }
        });

        if (!bid || bid.pitch.founderId !== session.user.id) {
            return new NextResponse("Not Found or Unauthorized", { status: 404 });
        }

        const updatedBid = await prisma.bid.update({
            where: { id: bidId },
            data: { status }
        });

        return NextResponse.json(updatedBid);
    } catch (error) {
        console.error("[BIDS_MANAGE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
