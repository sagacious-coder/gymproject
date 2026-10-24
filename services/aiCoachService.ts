const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

/**
 * Sends the user question and recent workout data to Groq's Llama-3 70B
 * to get actionable, elite AI coaching advice.
 */
export async function askAICoach(question: string, recentData: any): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('EXPO_PUBLIC_GROQ_API_KEY is missing. Please configure it in your environment.');
  }

  const systemPrompt = `You are an elite AI fitness coach and sports scientist. You will be provided with the user's aggregated workout data in JSON format and a question from the user. Analyze the data strictly based on what is provided, identify trends, and give a concise, actionable, and encouraging 2-3 sentence answer.

User's Aggregated Workout Data:
${JSON.stringify(recentData, null, 2)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq AI Coach request failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const reply = json.choices?.[0]?.message?.content?.trim();

  return reply || 'Keep pushing your limits! Consistency in tracking is the foundation of peak performance.';
}
