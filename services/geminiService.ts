import { GoogleGenAI } from "@google/genai";
import { SessionStats } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

export const generateDragonKeeperFeedback = async (stats: SessionStats): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "Great job, Dragon! Your inner fire is growing stronger.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `
      You are an epic Dragon Keeper in a fantasy world.
      A user (an aspiring dragon) has just completed a breathing exercise session.
      
      Stats:
      - Total Fire Breaths: ${stats.totalBreaths}
      - Longest Flame Duration: ${stats.maxDuration.toFixed(1)} seconds
      - Average Flame Intensity: ${(stats.avgIntensity * 100).toFixed(0)}%
      
      Give them brief, motivating feedback in the style of a wise fantasy mentor. 
      If they held their breath for long durations (>4s), praise their "Roaring Fire".
      If short breaths, encourage them to "Stoke the embers".
      Keep it under 2 sentences.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Your fire burns bright, young dragon!";
  } catch (error) {
    console.error("Gemini feedback error:", error);
    return "Your fire burns bright, young dragon! (The Dragon Keeper is meditating and cannot speak right now)";
  }
};