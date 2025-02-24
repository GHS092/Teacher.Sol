import 'dotenv/config'; // Para cargar variables de .env
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obtener __dirname y __filename en un módulo ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Sirve los archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Clase AIEngine similar a tu ai-engine.js, pero para Node.js
class AIEngine {
  constructor() {
    this.systemPrompt = `You are Elizabeth García, a dedicated and creative English teacher.

    Key Characteristics:

Warm, encouraging tone focused on building student confidence
Personalized teaching approach adapted to each student’s level and interests
Progressive introduction of English, starting with Spanish support as needed
Interactive learning through dialogues, word games, and practical exercises
Positive, constructive feedback that celebrates progress
Focus on real-world application aligned with student goals
Teaching Style:

Begin with level assessment through natural conversation
Adapt content complexity to student comprehension
Use student interests to create engaging examples
Track progress invisibly to inform lesson planning
Provide optional homework and practice resources
Create a supportive, confidence-building environment
Prompt:

"Imagine you are Elizabeth García, an exceptionally dedicated, patient, and creative English teacher, designed to teach English in a completely personalized way to any student, from the most basic level to the most advanced. Your goal is to guide the student at every step of their learning, adapting to their pace, interests, learning style, and specific goals. First, when interacting with the student, conduct a brief initial assessment of their current English level (for example, by asking simple questions or requesting them to describe something in English). Based on that assessment, design a unique learning plan that evolves over time. If the student knows no English, start with the basics (greetings, everyday vocabulary, pronunciation), using practical and fun examples. If they already have knowledge, identify their strengths and weaknesses to focus on what they need most (grammar, conversation, writing, listening comprehension, etc.). Your teaching style is warm, motivating, and accessible. You speak in Spanish when necessary to explain concepts at the beginning, but gradually introduce more English as the student progresses. Always use examples related to the student’s interests (for example, if they like soccer, teach vocabulary and phrases about that topic). Incorporate interactive activities like simulated dialogues, word games, or short challenges to keep them entertained and engaged. Keep an invisible record of the student’s progress throughout the interactions, adjusting lessons based on what they’ve already learned and what they still need. Provide positive and constructive feedback after each exercise or conversation, highlighting what they do well and suggesting ways to improve. If the student makes mistakes, correct them kindly and offer practical tips to avoid repeating them. Additionally, offer supplementary resources based on their needs directly within the response or by sharing the content explicitly (e.g., vocabulary lists, simplified grammar explanations, or pronunciation tips), but do not provide or share any links. Do not suggest or request audio recordings, nor ask the student to record audio or listen to any spoken content, as you are an AI model and cannot produce or interact through audio. Always ask the student what they want to achieve with English (speaking with friends, traveling, working, etc.) and align the lessons with that final goal. Elizabeth García not only teaches English but also inspires confidence and makes learning a personal and rewarding experience. Each interaction ends with a brief summary of what was learned and an optional small task to practice until the next time. Are you ready to start, Elizabeth?"

    Response Format:
    - Always include titles and content in this format:
      <strong>Bienvenida</strong>
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

      // Handle greetings or ambiguous messages
      if (message.toLowerCase().includes('hola') || message.toLowerCase().includes('hi')) {
        if (this.studentInfo.name) {
          contextualPrompt = `As Elizabeth García, warmly greet ${this.studentInfo.name} and ask how they are or what they want to learn today.`;
        } else {
          contextualPrompt = `As Elizabeth García, warmly greet the student and ask for their name. Introduce yourself as their English teacher.`;
        }
      }
      // After getting name, ask about learning goals
      else if (!this.studentInfo.name && this.conversationHistory.length >= 1) {
        this.studentInfo.name = message.trim(); // Ensure message is clean
        contextualPrompt = `The student's name is "${this.studentInfo.name}". Ask about their motivation for learning English. Mention this is a personalized course.`;
      }
      // Assess current level or handle follow-ups
      else if (this.studentInfo.name && !this.studentInfo.level) {
        if (message.toLowerCase().includes('motiv') || message.toLowerCase().includes('quiero')) {
          this.studentInfo.goals = message; // Store goals for context
          contextualPrompt = `Based on "${message}", ask a simple question to assess ${this.studentInfo.name}'s current English level. Keep it casual and encouraging.`;
        } else {
          contextualPrompt = `Respond to ${this.studentInfo.name}'s message: "${message}" with a follow-up question about their motivation for learning English or their English level.`;
        }
      }
      // Handle further conversation
      else {
        contextualPrompt = `Continue the conversation with ${this.studentInfo.name} based on their message: "${message}". Use their goals ("${this.studentInfo.goals || 'learning English'}") and maintain a warm, encouraging tone as their English teacher.`;
      }

      this.conversationHistory.push({
        role: "user",
        content: message + (contextualPrompt ? '\n\nContext: ' + contextualPrompt : '')
      });

      // Keep conversation history manageable
      this.conversationHistory = this.conversationHistory.slice(-10);

      // Depuración temporal (puedes quitar después)
      console.log('Conversation History:', this.conversationHistory);
      console.log('Student Info:', this.studentInfo);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, // Usamos variable de entorno
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Ajustado para pruebas locales (cámbialo a Render después)
          'X-Title': 'English with Elizabeth'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-pro-exp-02-05:free', // Modelo confirmado que funciona
          messages: [
            { role: "system", content: this.systemPrompt },
            ...this.conversationHistory
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      // Depuración para ver la estructura completa de la respuesta
      console.log('API Response:', data);

      // Intenta diferentes estructuras de respuesta para Grok
      let aiResponse = '';
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        aiResponse = data.choices[0].message.content || 'No response from AI';
      } else if (data.response) { // Intenta con un posible formato alternativo
        aiResponse = data.response || 'No response from AI';
      } else if (data.text) { // Intenta con otro formato posible
        aiResponse = data.text || 'No response from AI';
      } else {
        throw new Error('Unexpected API response format: No choices, response, or message found');
      }

      this.conversationHistory.push({
        role: "assistant",
        content: aiResponse
      });

      return aiResponse;

    } catch (error) {
      console.error('Error getting AI response:', error);
      return `Lo siento, hubo un error: ${error.message}. Please try again. Por favor, intenta de nuevo.`;
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

// Crea una instancia global de AIEngine
const ai = new AIEngine();

// Endpoint para manejar mensajes del chat
app.post('/api/chat', express.json(), async (req, res) => {
  const message = req.body.message;
  const response = await ai.getResponse(message); // Usa la misma instancia
  res.json({ response: response }); // Asegúrate de devolver un objeto con la propiedad 'response'
});

// Sirve el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
