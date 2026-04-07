import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

const SYSTEM_PROMPT = `You are FinPath, a warm friendly AI financial coach for working Indians. 
Help users understand their finances, set goals, reduce expenses, and plan investments. 
Use simple language. Always respond in a supportive, non-judgmental way. 
Use Indian Rupee (Rs) for all amounts. 
Keep responses concise and mobile-friendly.`;

export async function getOpenAIResponse(
  message: string,
  history: { role: 'user' | 'assistant', content: string }[],
  userContext?: any
) {
  try {
    let contextPrompt = SYSTEM_PROMPT;
    if (userContext) {
      contextPrompt += `\n\nUser Context:
      Name: ${userContext.name}
      City: ${userContext.city}
      Monthly Income: Rs ${userContext.income}
      Monthly Expenses: Rs ${userContext.expenses}
      Monthly Surplus: Rs ${userContext.income - userContext.expenses}
      Total Monthly EMI: Rs ${userContext.loans.reduce((acc: number, l: any) => acc + l.emi, 0)}
      Goals: ${userContext.goals.map((g: any) => `${g.name} (Target: Rs ${g.target}, Timeline: ${g.timeline} years)`).join(', ')}
      
      Please use this data to provide highly personalized advice.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: contextPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process that. Let's try again.";
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Namaste! I'm having a bit of trouble connecting to my OpenAI brain right now. Please try again in a moment.";
  }
}

export async function generateTripGoalReportOpenAI(input: {
  destination: string;
  countryList: string[];
  startMonthYear: string;
  days: number;
  travelers: number;
  groupType: string;
  style: string;
}) {
  const {
    destination,
    countryList,
    startMonthYear,
    days,
    travelers,
    groupType,
    style,
  } = input;

  const prompt = `
You are a financial and travel planning assistant for an Indian user saving for a future trip.

Goal: Plan a ${days}-day ${style} ${destination} trip in ${startMonthYear} for ${travelers} ${groupType.toLowerCase()} traveler(s) from India.
Countries: ${countryList.join(', ')}

1) Estimate cost today (in INR, approximate range) broken down into:
   - Flights
   - Stay
   - Food
   - Local transport
   - Activities / tickets
   - Buffer / misc

2) Estimate cost if the trip happens in ${startMonthYear}, assuming travel cost inflation between 6%–10% per year. 
   - Show a single “future cost” range in INR.
   - Briefly explain the inflation assumption and years until trip.

3) For savings planning:
   - Assume the user starts saving from now until ${startMonthYear}.
   - Calculate required savings per month in INR to reach the future cost (give a simple number, not exact finance math).
   - Provide a simple explanation in plain language (no formulas).

4) Suggest “cheapest time to visit” for this trip:
   - Mention 2–3 cheaper months and 2–3 more expensive months.
   - Focus on tradeoff between cost and experience (weather, crowds etc.).
   - Tailor answer to Europe for an Indian family.

Output must be valid JSON only.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI Trip Goal Report Error:", error);
    throw error;
  }
}

export async function generateMiniGoalReportOpenAI(itemName: string) {
  const prompt = `
You are a shopping and financial assistant for an Indian user.
Goal: Provide a detailed report for buying "${itemName}" in India.

1) Estimate current market price in INR (approximate).
2) Provide a price comparison across 3 major Indian retailers (e.g., Amazon, Flipkart, Reliance Digital, Croma, etc.).
3) Provide 3-4 "Smart Tips" for buying this item (e.g., best time to buy, credit card offers, exchange deals, or if a newer model is coming).
4) Categorize the item (e.g., Electronics, Fashion, Home, etc.).

Output must be valid JSON only.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI Mini Goal Report Error:", error);
    throw error;
  }
}
