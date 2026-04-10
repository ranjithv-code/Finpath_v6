import { GoogleGenAI, Type } from "@google/genai";
import { generateTripGoalReportOpenAI } from "./openai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are FinPath, a warm friendly AI financial coach for working Indians. 
Help users understand their finances, set goals, reduce expenses, and plan investments. 
Use simple language. Always respond in a supportive, non-judgmental way. 
Use Indian Rupee (Rs) for all amounts. 
Keep responses concise and mobile-friendly.`;

export async function generateTripGoalReport(input: {
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
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tripSummary: {
              type: Type.OBJECT,
              properties: {
                destination: { type: Type.STRING },
                durationDays: { type: Type.NUMBER },
                style: { type: Type.STRING },
                groupType: { type: Type.STRING }
              }
            },
            costToday: {
              type: Type.OBJECT,
              properties: {
                minInr: { type: Type.NUMBER },
                maxInr: { type: Type.NUMBER },
                breakdown: {
                  type: Type.OBJECT,
                  properties: {
                    flights: { type: Type.NUMBER },
                    stay: { type: Type.NUMBER },
                    food: { type: Type.NUMBER },
                    transport: { type: Type.NUMBER },
                    activities: { type: Type.NUMBER },
                    buffer: { type: Type.NUMBER }
                  }
                }
              }
            },
            costFuture: {
              type: Type.OBJECT,
              properties: {
                monthYear: { type: Type.STRING },
                minInr: { type: Type.NUMBER },
                maxInr: { type: Type.NUMBER },
                assumptions: { type: Type.STRING }
              }
            },
            savingPlan: {
              type: Type.OBJECT,
              properties: {
                monthsToSave: { type: Type.NUMBER },
                requiredPerMonthInr: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              }
            },
            timingAdvice: {
              type: Type.OBJECT,
              properties: {
                cheaperMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
                expensiveMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
                notes: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Trip Goal Report Error (Gemini):", error);
    try {
      console.log("Attempting OpenAI fallback...");
      return await generateTripGoalReportOpenAI(input);
    } catch (fallbackError) {
      console.error("Trip Goal Report Error (OpenAI Fallback):", fallbackError);
      throw error;
    }
  }
}

export async function generateMiniGoalReport(itemName: string) {
  const prompt = `
You are a shopping and financial assistant for an Indian user.
Goal: Provide a detailed report for buying "${itemName}" in India.

1) Estimate current market price in INR (approximate).
2) Provide a price comparison across 3 major Indian retailers (e.g., Amazon, Flipkart, Reliance Digital, Croma, etc.).
3) Provide 3-4 "Smart Tips" for buying this item (e.g., best time to buy, credit card offers, exchange deals, or if a newer model is coming).
4) Categorize the item (e.g., Electronics, Fashion, Home, Lifestyle, etc.).

Output must be valid JSON only.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            targetPrice: { type: Type.NUMBER },
            comparisons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  store: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                }
              }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Mini Goal Report Error (Gemini):", error);
    throw error;
  }
}

export async function getCoachResponse(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  userContext?: any
) {
  try {
    const model = "gemini-3-flash-preview";
    
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
    
    const response = await genAI.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: contextPrompt }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "I'm sorry, I couldn't process that. Let's try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Namaste! I'm having a bit of trouble connecting right now. Please try again in a moment.";
  }
}
