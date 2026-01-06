
import { GoogleGenAI, Chat, GenerateContentResponse, ToolConfig, Tool, Type } from "@google/genai";
import { GeminiResponseChunk } from '../types';

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat;
  private currentLatitude: number | null = null;
  private currentLongitude: number | null = null;

  constructor() {
    // CRITICAL: Create a new GoogleGenAI instance to ensure the latest API key is used.
    // The API key is injected via process.env.API_KEY.
    if (!process.env.API_KEY) {
      console.error("API_KEY is not set. Please ensure it is configured in your environment.");
      throw new Error("API_KEY is not set. Cannot initialize GeminiService.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview', // Default model for chat
      config: {
        systemInstruction: "You are a friendly and helpful AI assistant. Always consider the current date, time, and user's location (if provided) when generating responses. Provide concise and relevant information. If specific data is needed, try to use Google Search or Google Maps tools.",
      },
    });
    this.initializeGeolocation();
  }

  private initializeGeolocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLatitude = position.coords.latitude;
          this.currentLongitude = position.coords.longitude;
          console.log("Geolocation obtained:", this.currentLatitude, this.currentLongitude);
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error.message);
          // Fallback or inform user if location-based features are requested without permission
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
  }

  private detectToolUsage(query: string): 'googleSearch' | 'googleMaps' | 'none' {
    const lowerQuery = query.toLowerCase();

    // Keywords for Google Maps
    const mapsKeywords = ['nearby', 'near me', 'restaurants', 'cafes', 'shops', 'directions', 'location of', 'address of', 'what is around me'];
    if (mapsKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'googleMaps';
    }

    // Keywords for Google Search
    const searchKeywords = ['latest news', 'who won', 'what is happening', 'current events', 'stock market', 'weather in', 'fact about', 'how to', 'explain'];
    if (searchKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'googleSearch';
    }

    return 'none';
  }

  public async *sendMessageStream(message: string): AsyncGenerator<GeminiResponseChunk> {
    try {
      // Re-initialize GoogleGenAI for each API call to ensure the latest API_KEY is always used.
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const toolType = this.detectToolUsage(message);
      let modelName: string;
      let toolConfig: ToolConfig | undefined = undefined;
      let tools: Tool[] | undefined = undefined;
      let responseMimeType: string | undefined = undefined;
      let responseSchema: any | undefined = undefined;

      // Get current date and time
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-US');
      const currentTime = now.toLocaleTimeString('en-US');

      let contextualMessage = `Current date: ${currentDate}. Current time: ${currentTime}. `;
      if (this.currentLatitude !== null && this.currentLongitude !== null) {
        contextualMessage += `User location: ${this.currentLatitude}, ${this.currentLongitude}. `;
      }
      contextualMessage += `User query: ${message}`;


      if (toolType === 'googleSearch') {
        modelName = 'gemini-3-flash-preview'; // Required model for Google Search
        tools = [{ googleSearch: {} }];
      } else if (toolType === 'googleMaps') {
        modelName = 'gemini-2.5-flash'; // Required model for Google Maps
        tools = [{ googleMaps: {} }];
        if (this.currentLatitude !== null && this.currentLongitude !== null) {
          toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: this.currentLatitude,
                longitude: this.currentLongitude,
              },
            },
          };
        } else {
          console.warn("Geolocation not available for Google Maps query. Proceeding without location context.");
          // Inform the user or fallback here
        }
        // responseMimeType and responseSchema are NOT allowed with googleMaps
      } else {
        // Default models for general intelligence
        // Use Pro for complex tasks, Flash for fast tasks. Simple heuristic here.
        modelName = message.split(' ').length > 20 ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      }

      console.log(`Using model: ${modelName} with tool: ${toolType}`);

      const streamResponse = await this.chat.sendMessageStream({
        message: contextualMessage, // Use the contextualized message
        model: modelName,
        config: {
          tools: tools,
          toolConfig: toolConfig,
          responseMimeType: responseMimeType,
          responseSchema: responseSchema,
        },
      });

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        const groundingUrls: string[] = [];

        // Extract grounding URLs if available
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          for (const groundingChunk of c.candidates[0].groundingMetadata.groundingChunks) {
            if (groundingChunk.web?.uri) {
              groundingUrls.push(groundingChunk.web.uri);
            }
            if (groundingChunk.maps?.uri) {
              groundingUrls.push(groundingChunk.maps.uri);
            }
            if (groundingChunk.maps?.placeAnswerSources) {
              for (const source of groundingChunk.maps.placeAnswerSources) {
                if (source.reviewSnippets) {
                  for (const snippet of source.reviewSnippets) {
                    if (snippet.uri) {
                      groundingUrls.push(snippet.uri);
                    }
                  }
                }
              }
            }
          }
        }
        yield { text, groundingUrls: Array.from(new Set(groundingUrls)) };
      }
    } catch (error: any) {
      console.error("GeminiService error:", error);
      throw error; // Re-throw to be handled by the calling component
    }
  }
}

export { GeminiService };
