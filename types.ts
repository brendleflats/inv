// FIX: This file was placeholder content. Defined the core application types.
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  estimatedValue: number; // AI's suggestion
  listingPrice: number; // User-editable price
  condition: 'New' | 'Like New' | 'Used' | 'For Parts';
  conditionDetails: string[]; // Specific notes from AI, e.g., "scratches on side"
  confidence: number; // Confidence score from AI (0-100)
  image: string | null; // base64 image data URL
  image2: string | null; // base64 for second image (e.g., nameplate)
  status: 'Available' | 'Listed' | 'Sold';
  marketplaceListing: {
    title: string;
    description: string;
    tags: string[];
  } | null;
  listingUrl: string | null; // URL for the live marketplace listing
  groundingChunks?: {
    web: {
        uri: string;
        title: string;
    }
  }[];
}

export interface GeminiResponse {
    itemName: string;
    description: string;
    brand: string;
    estimatedValue: number;
    condition: 'New' | 'Like New' | 'Used' | 'For Parts';
    conditionDetails: string[];
    confidenceScore: number;
    groundingChunks?: {
        web: {
            uri: string;
            title: string;
        }
    }[];
}

export type AgentSuggestionType = 'BULK_LIST' | 'REVIEW_ITEM' | 'ADD_URL';
export type AgentSuggestionPriority = 'high' | 'medium' | 'low';

export interface AgentSuggestion {
    type: AgentSuggestionType;
    title: string;
    description: string;
    priority: AgentSuggestionPriority;
    itemId?: string;
}