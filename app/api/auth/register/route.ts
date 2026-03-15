import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, role, companyName } = body;

        if (!name || !email || !password || !role) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        if (role !== "INVESTOR" && role !== "FOUNDER") {
            return new NextResponse("Invalid role", { status: 400 });
        }

        const exist = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (exist) {
            return new NextResponse("Email already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                companyName: role === "FOUNDER" ? companyName : null,
                email,
                password: hashedPassword,
                role,
            },
        });

        // Remove password from the response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);
    } catch (error: any) {
        console.error(error, "REGISTRATION_ERROR");
        return new NextResponse("Internal Error", { status: 500 });
    }
}
