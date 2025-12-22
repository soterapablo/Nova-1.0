import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeIncident = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza el siguiente reporte de incidente en un observatorio astronómico: "${description}".
      Clasifica la severidad (LOW, MEDIUM, HIGH, CRITICAL), da un resumen muy breve y una categoría (ej: Mantenimiento, Seguridad, Software, Clima).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            summary: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["severity", "summary", "category"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text.trim());
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error analyzing incident:", error);
    return {
      severity: "MEDIUM",
      summary: "Análisis automático no disponible en este momento.",
      category: "General"
    };
  }
};

export const analyzeProject = async (title: string, description: string, objectives: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evalúa este proyecto astronómico/científico para el Observatorio Oro Verde. 
      Título: ${title}. Descripción: ${description}. Objetivos: ${objectives}.
      Determina la categoría (Investigación, Divulgación, Infraestructura, Educación), 
      un puntaje de factibilidad técnica del 1 al 100, y una sugerencia estratégica breve.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feasibilityScore: { type: Type.NUMBER },
            category: { type: Type.STRING },
            strategicSuggestion: { type: Type.STRING }
          },
          required: ["feasibilityScore", "category", "strategicSuggestion"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error("Error analyzing project:", error);
    return null;
  }
};

// Fix: Corrected schema nesting and fixed syntax errors that caused scope issues for 'response'
export const suggestObservationPlan = async (conditions: string) => {
    try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Ubicación: Observatorio Oro Verde, Argentina (-31.82, -60.52).
          Condiciones actuales/deseadas: ${conditions}.
          Sugiere 3 objetos celestes óptimos para observar esta noche. 
          Incluye nombre del objeto, tipo (Nebulosa, Galaxia, Cúmulo, etc), por qué es buena idea hoy y un consejo rápido de exposición fotográfica.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            type: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            photoTip: { type: Type.STRING }
                        },
                        required: ["name", "type", "reason", "photoTip"]
                    }
                }
              },
              required: ["suggestions"]
            }
          }
        });
        if (response.text) {
            return JSON.parse(response.text.trim());
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}