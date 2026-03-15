import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "FOUNDER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { videoUrl, pitchDeckUrl, description, industry } = body;

        if (!videoUrl || !description || !industry) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Helper to convert YouTube link to embed link
        let parsedVideoUrl = videoUrl;
        const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);

        if (ytMatch && ytMatch[1]) {
            parsedVideoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        } else if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
            return new NextResponse("Invalid YouTube URL format", { status: 400 });
        }

        const pitch = await prisma.pitch.create({
            data: {
                videoUrl: parsedVideoUrl,
                pitchDeckUrl: pitchDeckUrl || null,
                description,
                industry,
                founderId: session.user.id,
            },
        });

        return NextResponse.json(pitch);
    } catch (error) {
        console.error("[PITCHES_CREATE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
