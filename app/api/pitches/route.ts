import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "INVESTOR") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const pitches = await prisma.pitch.findMany({
            include: {
                founder: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(pitches);
    } catch (error) {
        console.error("[PITCHES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
