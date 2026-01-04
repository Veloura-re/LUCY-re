import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'TEACHER') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { image } = await req.json(); // base64 image data

        if (!image) {
            return NextResponse.json({ error: "Missing image data" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Extract all exam questions from this image. 
            Format the output as a JSON array of objects.
            Each object should have:
            - type: "MCQ" (always MCQ for now)
            - text: The question text
            - options: An array of 4 strings for choices
            - correctOption: The index (0-3) of the correct answer (guess if not certain, but try to be accurate)
            - points: 10 (default)

            Return ONLY the raw JSON array. No markdown code blocks, no preamble.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: image.split(",")[1], // Remove "data:image/jpeg;base64," prefix
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        let text = response.text().trim();

        // Clean up markdown code blocks if Gemini ignores the "ONLY raw JSON" instruction
        if (text.startsWith("```json")) {
            text = text.replace(/```json\n?/, "").replace(/\n?```/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/```\n?/, "").replace(/\n?```/, "");
        }

        try {
            const questions = JSON.parse(text);
            return NextResponse.json({ questions });
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", text);
            return NextResponse.json({ error: "AI returned invalid format", raw: text }, { status: 500 });
        }

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
    }
}
