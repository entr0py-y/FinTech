import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "FOUNDER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const title = formData.get("title") as string | null;
        const founderId = formData.get("founderId") as string | null;
        const file = formData.get("file") as File | null;

        if (!title || !founderId || !file) {
            return new NextResponse("Missing title, founderId, or file", { status: 400 });
        }

        if (session.user.id !== founderId) {
            return new NextResponse("Unauthorized founder", { status: 401 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, buffer);

        const fileUrl = `/uploads/${filename}`;

        const document = await prisma.document.create({
            data: {
                title,
                fileUrl,
                founderId,
            },
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("[VDR_UPLOAD_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
