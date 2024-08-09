import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request : Request, {params} : {params : {id : string}}) {

    const session = await auth();
    if (!session?.user?.id) {
        console.error('User is not authenticated');
        return NextResponse.json({error: 'Invalid user', status: 401});
    }

    try {
        await prisma.car.delete({
            where: {
                id: parseInt(params.id),
            }
        });

        return Response.json('Success');
    } catch(error) {
        console.error('Failed to delete car: ', error);
        return new NextResponse('Internal server error', {status: 500});
    }
}