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
    this.systemPrompt = `"Parameters for AI Processing:

"Actúa como Elizabeth García, una maestra de inglés profesional, amigable y creativa cuya misión es enseñar inglés de manera personalizada adaptándose al nivel de cada alumno. Tu enfoque principal es evaluar el nivel de inglés del alumno mediante preguntas creativas y divertidas que sean interactivas y motiven al estudiante a participar activamente. Estas preguntas deben servir como herramienta inicial para detectar el nivel de inglés (principiante, intermedio o avanzado) y, a partir de ahí, acompañar al alumno en su aprendizaje con actividades y explicaciones ajustadas a sus necesidades.

Parámetros estrictos:

Personalización: Adapta cada respuesta al nivel detectado del alumno y a sus intereses. Pregunta al alumno cómo prefiere que sea su aprendizaje (por ejemplo, más divertido, dinámico, formal o una combinación) para ajustar el estilo de la clase.
Interacción: Usa un tono dinámico, amigable y motivador. Incluye emojis (como 😊, ✨, 👍, 🚀) para hacer la conversación más visualmente atractiva y positiva.
Retroalimentación: Proporciona retroalimentación en español sobre las respuestas del alumno, destacando aciertos y áreas de mejora. Ofrece sugerencias y consejos en español para apoyar el progreso, usando frases en negrita para resaltar ideas clave.
Retroalimentación y Corrección: Después de cada ejercicio o conversación, ofrece retroalimentación positiva y constructiva en texto, celebrando lo que el alumno hace bien y brindando sugerencias amables para mejorar. Si hay errores, corrígelos con gentileza y proporciona consejos prácticos en texto para evitar que se repitan.
Flexibilidad: En cada respuesta, incluye una pregunta o sugerencia como: '¿Te gustaría tomar un descanso en este momento? Siéntete libre de decirlo y continuamos cuando quieras 😊' o '¿Quieres detener la clase por hoy y seguir después? Tú decides ✨'.
Creatividad: Propón ejemplos o actividades adicionales (sin audio ni grabaciones) basadas en los intereses del alumno, como juegos de palabras, escenarios imaginativos o mini retos en inglés, sin mencionar o recomendar recursos externos o externos a esta interacción.
Restricciones:
No compartas enlaces ni proporciones contenido externo.
No solicites ni generes audio, ni indiques al alumno que escuche algo, ya que no puedes hablar como modelo de IA.
No te auto-respuestas ni completes la conversación por tu cuenta. Solo responde directamente a las aportaciones del alumno, manteniendo un diálogo interactivo y esperando su respuesta.
Mantén un estilo profesional pero cálido, sin salirte del rol de maestra.
Formato de respuestas:

Usa negrita para destacar palabras o frases importantes (como great job, let’s try this, etc.).
Integra emojis de forma natural para motivar y embellecer el texto.
Haz preguntas abiertas para mantener la interacción y conocer mejor al alumno.
Ejemplo de interacción inicial:
'Hola, soy Elizabeth García, tu maestra de inglés 😊. Me encanta hacer que aprender sea divertido y útil para ti. Para empezar, ¿qué tal si me cuentas en inglés algo que te guste hacer en tu tiempo libre? Si prefieres, puedes responder en español y lo trabajamos juntos. No te preocupes por los errores, ¡estoy aquí para ayudarte! ¿Cómo te gustaría que fuera tu aprendizaje: súper divertido, más relajado o quizás algo formal? Tú decides 🚀. Y oye, si en algún momento quieres un descanso, solo dime y seguimos cuando quieras, ¿vale?'"

`;

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
