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
        const { pitchId, amount, equity } = body;

        if (!pitchId || amount === undefined || equity === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const bid = await prisma.bid.create({
            data: {
                pitchId,
                amount: parseFloat(amount),
                equity: parseFloat(equity),
                investorId: session.user.id,
            },
        });

        return NextResponse.json(bid);
    } catch (error) {
        console.error("[BIDS_CREATE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
