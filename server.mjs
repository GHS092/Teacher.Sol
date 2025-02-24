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
app.use(express.json());

// Clase AIEngine integrada en el servidor
class AIEngine {
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
    this.lastContext = '';
    this.suggestionCategories = {
      'initial greeting': [
        "¡Hola! Me gustaría aprender inglés",
        "¿Cómo empezamos las clases?",
        "¿Qué necesito para empezar?"
      ],
      'student introduction': [
        "¿Qué tipo de actividades haremos?",
        "¿Cómo evaluarás mi progreso?",
        "¿Qué métodos de enseñanza utilizas?"
      ],
      'level assessment': [
        "¿Qué nivel de inglés crees que tengo?",
        "¿Qué áreas debo mejorar primero?",
        "¿Cuánto tiempo me tomará mejorar?"
      ],
      'professional goals': [
        "¿Cómo puedo mejorar mi inglés para el trabajo?",
        "¿Qué vocabulario necesito para mi profesión?",
        "¿Cómo puedo practicar situaciones laborales?"
      ],
      'interests and motivation': [
        "¿Qué recursos recomiendas para mi nivel?",
        "¿Cómo puedo practicar en mi tiempo libre?",
        "¿Qué actividades se ajustan a mis intereses?"
      ],
      'general conversation': [
        "¿Podemos practicar pronunciación?",
        "¿Cómo puedo mejorar mi fluidez?",
        "¿Qué ejercicios recomiendas?"
      ]
    };

    // Add title generation system prompt
    this.titleGenerationPrompt = `As an AI assistant, analyze the conversation context and generate a concise, meaningful title that captures the main topic or theme being discussed.

    Rules for title generation:
    - Keep titles between 2-5 words
    - Focus on the main subject matter
    - Use proper capitalization
    - Avoid generic titles like "Chat" or "Conversation"
    - If the context is unclear, focus on the most recent topic
    - Remove any special characters that could cause issues
    - For language learning topics, use proper terminology (e.g. "Phrasal Verbs Practice")

    Return just the title text, nothing else.`;
  }

  async callOpenRouter(messages, json = false) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://teacher-sol.onrender.com', // Ajusta a tu URL en Render
        'X-Title': 'English with Elizabeth'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: messages,
        stream: false,
        ...(json ? { json: true } : {})
      })
    });

    if (!response.ok) {
      console.error('OpenRouter Error:', await response.text()); // Depuración
      throw new Error(`Error en la API: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    let result = '';
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      result = data.choices[0].message.content || 'No response from AI';
    } else if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      result = data.candidates[0].content.parts[0].text || 'No response from AI';
    } else if (data.response) {
      result = data.response || 'No response from AI';
    } else if (data.text) {
      result = data.text || 'No response from AI';
    } else {
      throw new Error('Unexpected API response format: No choices, candidates, response, or message found');
    }

    return json ? JSON.parse(result) : result;
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

      const response = await this.callOpenRouter([
        { role: "system", content: this.systemPrompt },
        ...this.conversationHistory.map(msg => ({ role: msg.role, content: msg.content }))
      ]);

      this.conversationHistory.push({ role: "assistant", content: response });
      return response;

    } catch (error) {
      console.error('Error getting AI response:', error);
      return "Lo siento, hubo un error. Please try again. Por favor, intenta de nuevo.";
    }
  }

  async getTranslation(text) {
    try {
      return await this.callOpenRouter([
        {
          role: "system",
          content: "You are a translator. Translate the following text to the opposite language (Spanish to English or English to Spanish). Respond with just the translation, no explanations."
        },
        {
          role: "user",
          content: text
        }
      ]);
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async getSuggestions() {
    try {
      const recentMessages = this.conversationHistory.slice(-5).map(m => m.content).join('\n');

      const suggestions = await this.callOpenRouter([
        {
          role: "system",
          content: `You are a helpful learning assistant, analyzing the conversation between Elizabeth García (the English teacher) and a student to suggest relevant questions the student could ask next.

Based on the recent conversation context, generate 3 natural follow-up questions that would be helpful for the student to ask Elizabeth. These should be questions that would help deepen the student's learning experience.

Return your suggestions as a JSON array of strings, and nothing else.
Example: ["¿Podría explicarme la diferencia entre 'make' y 'do'?", "¿Cómo puedo practicar esta pronunciación en casa?", "¿Qué otros ejemplos similares me puede dar?"]

The suggested questions should:
- Be natural follow-ups to what Elizabeth has been teaching
- Help explore related concepts or get clarification
- Be specific to the current learning context
- Be phrased in Spanish since they're for the student to ask
- Focus on getting more practice, examples, or deeper understanding`
        },
        {
          role: "user",
          content: recentMessages
        }
      ], true);

      return suggestions.length ? suggestions : [
        "¿Me podría dar más ejemplos similares?",
        "¿Cómo puedo practicar esto en casa?",
        "¿Puede explicármelo de otra manera?"
      ];
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [
        "¿Me podría dar más ejemplos similares?",
        "¿Cómo puedo practicar esto en casa?",
        "¿Puede explicármelo de otra manera?"
      ];
    }
  }

  async generateChatTitle(messages) {
    try {
      const recentMessages = messages.slice(-5).map(m => m.content).join('\n');

      const title = await this.callOpenRouter([
        {
          role: "system",
          content: `As an AI assistant, analyze the conversation context and generate a concise, meaningful title that captures the main topic or theme being discussed.

Rules for title generation:
- Keep titles between 2-5 words
- Focus on the main subject matter
- Use proper capitalization
- Avoid generic titles like "Chat" or "Conversation"
- If the context is unclear, focus on the most recent topic
- Remove any special characters that could cause issues
- For language learning topics, use proper terminology (e.g. "Phrasal Verbs Practice")

Return just the title text, nothing else.`
        },
        {
          role: "user", 
          content: `Generate a title for this conversation:\n${recentMessages}`
        }
      ]);

      return title.trim() || 'New Conversation';
    } catch (error) {
      console.error('Error generating chat title:', error);
      return 'New Conversation';
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

// Endpoints para la AI
app.post('/api/ai', async (req, res) => {
  const { message, history = [] } = req.body;
  ai.conversationHistory = history.map(msg => ({
    role: msg.role || "user",
    content: msg.content
  }));

  try {
    const response = await ai.getResponse(message);
    res.json({ response, history: ai.conversationHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/translate', async (req, res) => {
  const { text } = req.body;
  try {
    const translation = await ai.getTranslation(text);
    res.json({ translation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await ai.getSuggestions();
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/title', async (req, res) => {
  const { messages } = req.body;
  try {
    const title = await ai.generateChatTitle(messages);
    res.json({ title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sirve el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
