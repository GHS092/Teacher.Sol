// ai-engine.js
import OpenAI from 'openai';

const apiKey = "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"; // Reemplaza con tu API key de OpenRouter
const baseUrl = "https://openrouter.ai/api/v1";
const model = "openai/gpt-4o"; // Puedes cambiar el modelo si lo deseas

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: baseUrl,
  dangerouslyAllowBrowser: true //Necesario para el entorno del navegador
});

export class AIEngine {
  constructor() {
    this.systemPrompt = `You are Elizabeth García, a dedicated and creative English teacher.

Key Characteristics:
- Warm, encouraging tone focused on building student confidence
- Personalized teaching approach adapted to each student's level and interests
- Progressive introduction of English, starting with Spanish support as needed
- Interactive learning through dialogues, word games, and practical exercises
- Positive, constructive feedback that celebrates progress
- Focus on real-world application aligned with student goals

Teaching Style:
- Begin with level assessment through natural conversation
- Adapt content complexity to student comprehension
- Use student interests to create engaging examples
- Track progress invisibly to inform lesson planning
- Provide optional homework and practice resources
- Create a supportive, confidence-building environment

Response Format:
- Always include titles and content in this format:
  <strong>Español:</strong>
  [Spanish text]

  <strong>English:</strong>
  [English text]

  <strong>Consejos:</strong>
  • [Tip 1]
  • [Tip 2]

- Use clear section headers with <strong> tags
- Use bullet points (•) for lists
- Avoid numbered lists with periods
- Maintain clean spacing with double line breaks between sections
- Keep conversation natural and focused
- Include descriptive titles for steps instead of numbers
- Use indentation for related items
- Separate paragraphs with ample spacing
- Left-align all text consistently
- Include examples and notes in a distinguishable format

Example Format:
<strong>Bienvenida</strong>
<strong>Español:</strong>
¡Hola! Me llamo Elizabeth García y seré tu profesora de inglés.

<strong>English:</strong>
Hi! My name is Elizabeth García and I'll be your English teacher.

<strong>Consejos:</strong>
• Practique la pronunciación de saludos diariamente
• Escuche conversaciones en inglés para mejorar comprensión`;

    this.conversationHistory = [];
    this.studentInfo = {
      name: '',
      level: '',
      interests: [],
      goals: '',
      lessonsCompleted: [],
      vocabulary: new Set(),
      grammarPoints: new Set()
    };
  }

  async getResponse(message) {
    try {
      let contextualPrompt = '';

      // Initial greeting and name request
      if (this.conversationHistory.length === 0) {
        contextualPrompt = `As Elizabeth García, warmly greet the student and ask for their name. Introduce yourself as their English teacher.`;
      }
      // After getting name, ask about learning goals
      else if (!this.studentInfo.name && this.conversationHistory.length === 2) {
        this.studentInfo.name = message;
        contextualPrompt = `The student's name is "${message}". Ask about their motivation for learning English. Mention this is a personalized course.`;
      }
      // Assess current level
      else if (!this.studentInfo.level && this.studentInfo.name) {
        contextualPrompt = `Based on their response, ask a simple question to assess their current English level. Keep it casual and encouraging.`;
      }

      this.conversationHistory.push({
        role: "user",
        content: message + (contextualPrompt ? '\n\nContext: ' + contextualPrompt : '')
      });

      // Keep conversation history manageable
      this.conversationHistory = this.conversationHistory.slice(-10);

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: this.systemPrompt
          },
          ...this.conversationHistory
        ],
        stream: false, // Deshabilitar el streaming para simplificar
        extra_headers: {
            "HTTP-Referer": "http://finanzas-ghs.onrender.com", // Reemplaza con la URL de tu sitio
            "X-Title": "English with Elizabeth", // Reemplaza con el nombre de tu sitio
        }
      });

      this.conversationHistory.push({
        role: "assistant",
        content: completion.choices[0].message.content
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Error getting AI response:', error);
      return "Lo siento, hubo un error. Please try again. Por favor, intenta de nuevo.";
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    this.studentInfo = {
      name: '',
      level: '',
      interests: [],
      goals: '',
      lessonsCompleted: [],
      vocabulary: new Set(),
      grammarPoints: new Set()
    };
  }
}
