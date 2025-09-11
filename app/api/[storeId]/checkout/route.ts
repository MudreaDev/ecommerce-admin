import { NextResponse } from "next/server";
import { cryptomus } from "@/lib/cryptomus";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
    req: Request,
    { params }: { params: { storeId: string } }
) {
    try {
        const { productIds } = await req.json();
        
        if (!productIds || productIds.length === 0) {
            return new NextResponse("Product IDs are required", { status: 400 });
        }

        const products = await prismadb.product.findMany({
            where: {
                id: { in: productIds },
            },
        });

        // Calculează totalul
        const totalAmount = products.reduce((total, product) => {
            return total + product.price.toNumber();
        }, 0);

        // Creează order în baza de date
        const order = await prismadb.order.create({
            data: {
                storeId: params.storeId,
                isPaid: false,
                orderItems: {
                    create: productIds.map((productId: string) => ({
                        product: {
                            connect: {
                                id: productId,
                            },
                        },
                    })),
                },
            },
        });

        // Creează plata cu Cryptomus
        const paymentData = {
            amount: totalAmount.toString(),
            currency: 'USD',
            order_id: order.id,
            url_return: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
            url_callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/${params.storeId}/webhook/cryptomus`,
            to_currency: 'USDT', // sau altă crypto dorită
            lifetime: 3600, // 1 oră
        };

        const payment = await cryptomus.createPayment(paymentData);

        if (payment.state !== 0) {
            throw new Error('Failed to create Cryptomus payment');
        }

        return NextResponse.json({ 
            url: payment.result.url,
            paymentId: payment.result.uuid,
            orderId: order.id 
        }, { headers: corsHeaders });

    } catch (error) {
        console.log('[CHECKOUT_POST]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}