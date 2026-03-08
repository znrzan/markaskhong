import { NextResponse } from 'next/server';

// Fonnte API Endpoint
const FONNTE_API_URL = 'https://api.fonnte.com/send';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, message } = body;

        if (!phone || !message) {
            return NextResponse.json(
                { success: false, error: 'Phone number and message are required' },
                { status: 400 }
            );
        }

        // Ambil token dari environment variables
        const token = process.env.FONNTE_TOKEN;

        if (!token) {
            console.warn("Waduh, FONNTE_TOKEN belum di-set nih di .env.local. Masuk Simulation mode yaa 🚀");
            return NextResponse.json(
                { success: true, warning: 'Simulation mode (No Token)', simulated_message: message },
                { status: 200 }
            );
        }

        // Format target phone (Fonnte takes multiple comma separated, or single)
        // Often it requires country code. If user input 08..., we can let Fonnte handle it or format it.
        // Fonnte handles 08xxx to 628xxx automatically most of the time.

        const response = await fetch(FONNTE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: phone,
                message: message,
                typing: false,
                delay: '2',
                countryCode: '62' // Pastikan kode negara Indonesia
            })
        });

        const data = await response.json();

        if (data.status) {
            return NextResponse.json({ success: true, data });
        } else {
            console.error("Fonnte API Error:", data);
            return NextResponse.json({ success: false, error: data.reason || 'Failed to send WhatsApp' }, { status: 400 });
        }

    } catch (error: any) {
        console.error("WhatsApp API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
