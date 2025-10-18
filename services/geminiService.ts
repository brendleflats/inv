// FIX: This file was placeholder content. Implemented the Gemini service to analyze items.
import { GoogleGenAI, Type } from "@google/genai";
import { AgentSuggestion, GeminiResponse, InventoryItem } from '../types';

// FIX: Per coding guidelines, the API key must be retrieved from `process.env.API_KEY`. 
// This resolves the TypeScript error `Property 'env' does not exist on type 'ImportMeta'`.
const apiKey = process.env.API_KEY;

// This is a critical check. If the API key is not available in the environment,
// the application cannot function. This provides a clear error message on screen
// and in the console instead of a blank page.
// FIX: Updated error messages to reference API_KEY for consistency with the required environment variable.
if (!apiKey) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;padding:20px;background-color:#7f1d1d;color:white;font-family:sans-serif;font-size:16px;z-index:9999;text-align:center;';
  errorDiv.innerHTML = '<strong>Configuration Error:</strong> The API key is missing. Please ensure the <code>API_KEY</code> environment variable is set correctly for your deployment.';
  document.body.prepend(errorDiv);
  throw new Error("FATAL: API_KEY is not defined in the environment. The application cannot connect to the AI service.");
}

// Create a single, shared AI client instance for the entire application.
export const ai = new GoogleGenAI({ apiKey });


// FIX: Helper function to convert a base64 data URL into the format required by the Gemini API.
function dataUrlToGeminiPart(dataUrl: string) {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType || !data) {
        throw new Error("Invalid data URL format");
    }
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
}

export async function analyzeItem(image1: string | null, image2: string | null, text: string | null): Promise<GeminiResponse> {
    if (!image1 && !image2 && (!text || text.trim() === '')) {
        throw new Error("Either an image or a description must be provided.");
    }

    // FIX: Updated system instruction to be more explicit and provide an example to prevent non-JSON responses.
    const systemInstruction = `You are an expert appraiser for a factory liquidation. Your task is to identify an item from images and/or text.
Use Google Search to find comparable items being sold online to determine a realistic liquidation value in USD. Be realistic; these are for quick sale, not retail.
Your response MUST be ONLY a single, valid JSON object.
Do NOT include markdown formatting like \`\`\`json.
Do NOT include any text, explanation, or conversational filler before or after the JSON object.

The JSON object must have this exact structure:
{
  "itemName": "string",
  "description": "string",
  "brand": "string",
  "estimatedValue": number,
  "condition": "New" | "Like New" | "Used" | "For Parts",
  "conditionDetails": ["string"],
  "confidenceScore": number
}

Example of a perfect response:
{
  "itemName": "Dayton 3/4 HP Bench Grinder",
  "description": "A heavy-duty bench grinder suitable for sharpening, grinding, and deburring tasks. Features a 3/4 horsepower motor and dual grinding wheels.",
  "brand": "Dayton",
  "estimatedValue": 120,
  "condition": "Used",
  "conditionDetails": ["Visible rust on the tool rests", "Minor scratches on the casing", "Wheels appear to be in good condition"],
  "confidenceScore": 88
}`;

    const parts: any[] = [];
    
    let promptText = text || "Please analyze the attached image(s) and provide your appraisal.";
    if (image1 && image2) {
        promptText += " I have provided two images for a more detailed analysis."
    }
    parts.push({ text: promptText });

    if (image1) {
        parts.push(dataUrlToGeminiPart(image1));
    }
    if (image2) {
        parts.push(dataUrlToGeminiPart(image2));
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}]
            }
        });
        
        let responseText = response.text.trim();
        
        // FIX: Added robust logic to extract a JSON object from a string that might contain other text.
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            responseText = responseText.substring(jsonStart, jsonEnd + 1);
        }

        const parsedJson = JSON.parse(responseText);
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        return {
            ...parsedJson,
            groundingChunks: groundingChunks || [],
        } as GeminiResponse;

    } catch (error: any)
    {
        console.error("Error calling Gemini API:", error);
        if (error?.message && (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID"))) {
            throw new Error("Invalid API Key. Please check your environment configuration.");
        }
        if (error instanceof SyntaxError) {
            throw new Error("Failed to analyze item. The AI returned an invalid response that could not be read.");
       }
        throw new Error("Failed to analyze item. The AI service may be unavailable or the response was invalid.");
    }
}

export async function generateMarketplaceListing(item: InventoryItem): Promise<{ title: string; description: string; tags: string[] }> {
    const systemInstruction = `You are an expert in e-commerce listings. Based on the provided item details, generate a compelling marketplace listing. Create a catchy title, a detailed description highlighting key features and condition, and a list of relevant SEO keywords/tags. The response must be a JSON object.`;

    const prompt = `
        Item Name: ${item.name}
        Brand: ${item.brand}
        Condition: ${item.condition}
        Condition Details: ${item.conditionDetails.join(', ')}
        Description: ${item.description}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt}] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the listing." },
                        description: { type: Type.STRING, description: "A detailed and persuasive sales description." },
                        tags: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "A list of 5-10 relevant keywords or tags for searchability."
                        }
                    },
                    required: ["title", "description", "tags"]
                }
            }
        });

        const responseText = response.text.trim();
        return JSON.parse(responseText);

    } catch (error: any) {
        console.error("Error generating marketplace listing:", error);
        if (error?.message && (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID"))) {
            throw new Error("Invalid API Key. Please check your environment configuration.");
        }
        throw new Error("Failed to generate listing. The AI service may be unavailable.");
    }
}

export async function getAgentSuggestions(items: InventoryItem[]): Promise<AgentSuggestion[]> {
    // FIX: Corrected typo from I0 to 0.
    if (items.length === 0) return [];

    const systemInstruction = `You are an AI assistant for a factory liquidation. Your goal is to help the user liquidate all their items and reach their financial goal.
    Analyze the provided JSON summary of the current inventory.
    Based on the summary, provide a list of 1-3 concrete, actionable suggestions for the user.
    For each suggestion, you MUST assign a 'priority' based on its potential impact and urgency.

    Your response MUST be a JSON array of objects, where each object has 'type', 'title', 'description', 'priority', and an optional 'itemId'.
    
    Priority Levels:
    - 'high': Urgent actions that unblock the user or address potentially undervalued items. Example: Reviewing an item with an unusually low value ('$0' or '$1') is a high priority.
    - 'medium': Important actions for making progress. Example: Bulk listing available items is a good next step. Adding a URL to a listed item is also a medium priority.
    - 'low': Good-to-have suggestions or optimizations. Example: Reviewing a regular item that just seems okay could be low priority.

    Possible suggestion types and when to use them:
    - 'BULK_LIST': Use this if there are several items with the status 'Available'. This is usually a 'medium' priority.
    - 'REVIEW_ITEM': Use this for an item that has a very low estimated value, is missing key details, or might benefit from a better photo or description. Choose a specific item and include its 'itemId'. The priority can be 'high' if the value is suspiciously low.
    - 'ADD_URL': Use this for an item that is 'Listed' but is missing its 'listingUrl'. This is usually a 'medium' priority.
    
    Make the title and description encouraging and helpful. Be strategic. What is the most important next step for the user?`;

    const inventorySummary = items.map(item => ({
        id: item.id,
        name: item.name,
        status: item.status,
        estimatedValue: item.estimatedValue,
        listingUrl: !!item.listingUrl
    }));
    
    const prompt = `Here is the current inventory summary: ${JSON.stringify(inventorySummary)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['BULK_LIST', 'REVIEW_ITEM', 'ADD_URL'] },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                            itemId: { type: Type.STRING },
                        },
                        required: ['type', 'title', 'description', 'priority'],
                    }
                }
            }
        });
        const responseText = response.text.trim();
        return JSON.parse(responseText);
    } catch (error: any) {
        console.error("Error getting agent suggestions:", error);
        if (error?.message && (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID"))) {
            console.error("Invalid API Key detected. Suggestions will be disabled.");
            return [{
                type: 'REVIEW_ITEM',
                title: 'AI Assistant Offline',
                description: 'The AI assistant is offline due to an invalid API Key. Please check your environment configuration. Core appraisal features will still function.',
                priority: 'high',
            }];
        }
        // Return a default suggestion on error to avoid breaking the UI
        return [{
            type: 'BULK_LIST',
            title: 'List Available Items',
            description: 'You have items ready to be listed. Let me generate marketplace listings for them to get them sold!',
            priority: 'medium',
        }];
    }
}