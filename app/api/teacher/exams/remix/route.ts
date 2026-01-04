import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'TEACHER') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { questions } = await req.json();

        if (!questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: "No questions provided for remixing" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert assessment designer. Your task is to REMIX the following exam questions.
            
            OBJECTIVES:
            1. Generate DIFFERENT but SIMILAR questions that cover the EXACT SAME academic topics.
            2. Maintain the same difficulty level.
            3. Keep the EXACT SAME structure (type, points, number of options).
            4. For MCQs, change the options and correct answer if possible, but keep them plausible.
            5. For Short Answer, change the numbers or specified criteria if applicable.
            
            Original Questions:
            ${JSON.stringify(questions, null, 2)}
            
            Return ONLY a raw JSON array of the remixed questions. DO NOT include the original questions. DO NOT include any text outside the JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        if (text.startsWith("```json")) {
            text = text.replace(/```json\n?/, "").replace(/\n?```/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/```\n?/, "").replace(/\n?```/, "");
        }

        try {
            const remixedQuestions = JSON.parse(text);
            return NextResponse.json({ questions: remixedQuestions });
        } catch (parseError) {
            return NextResponse.json({ error: "AI returned invalid format", raw: text }, { status: 500 });
        }

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Remix generation failed" }, { status: 500 });
    }
}
