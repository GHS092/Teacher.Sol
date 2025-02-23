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

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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', // Tu API key actual o la más reciente
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://teacher-sol.onrender.com', // Ajustado para Render
          'X-Title': 'English with Elizabeth'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite-preview-02-05:free', // Modelo confirmado que funciona
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
      const aiResponse = data.choices[0].message.content;

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
