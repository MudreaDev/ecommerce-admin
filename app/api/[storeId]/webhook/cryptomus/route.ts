import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cryptomus } from "@/lib/cryptomus";
import prismadb from "@/lib/prismadb";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const body = await req.json();
        const headersList = await headers();
        const sign = headersList.get("sign");
        const { storeId } = await params;

        if (!sign) {
            return new NextResponse("Missing signature", { status: 400 });
        }

        // Verifică semnătura webhook-ului
        const isValid = cryptomus.verifyWebhook(body, sign);
        
        if (!isValid) {
            return new NextResponse("Invalid signature", { status: 400 });
        }

        const {
            order_id,
            uuid,
            payment_status,
            amount,
            currency,
            txid
        } = body;

        // Verifică dacă plata a fost confirmată
        if (payment_status === "paid" || payment_status === "paid_over") {
            const order = await prismadb.order.update({
                where: {
                    id: order_id,
                },
                data: {
                    isPaid: true,
                    // Poți adăuga și alte câmpuri dacă vrei să stochezi info despre tranzacție
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // Aici poți adăuga logică suplimentară pentru procesarea comenzii
            console.log(`Order ${order_id} has been paid via Cryptomus`);
            console.log(`Transaction ID: ${txid}`);
            console.log(`Amount: ${amount} ${currency}`);
        }

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.log('[CRYPTOMUS_WEBHOOK]', error);
        return new NextResponse("Webhook handler failed", { status: 500 });
    }
}