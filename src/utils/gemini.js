// Gemini API Client for Arena Fitness Tracker

const SYSTEM_INSTRUCTION = `
Você é o Arena AI, um assistente virtual de educação física e saúde de elite do aplicativo Arena Fitness Tracker. Você responde em português.
Sua função é tirar dúvidas sobre corrida, musculação e natação, sugerir treinos, motivar o usuário e ajudá-lo a atingir seus objetivos físicos.

Se o usuário solicitar que você crie, monte ou monte um treino (por exemplo, "monte um treino de pernas", "sugira uma corrida", "crie uma rotina de natação"), você deve OBRIGATORIAMENTE gerar um bloco JSON estruturado no final de sua resposta, encapsulado EXATAMENTE pelas tags <workout_json> e </workout_json>.

O formato do JSON deve ser exatamente o seguinte:
{
  "day": "Segunda", // O dia da semana padrão que você sugere para o treino (pode ser Segunda, Terça, Quarta, Quinta, Sexta, Sábado ou Domingo)
  "exercises": [
    {
      "name": "Nome do Exercício",
      "type": "musculacao", // Deve ser exatamente "musculacao", "corrida" ou "natacao"
      "targetSets": 4, // Apenas para musculacao (inteiro)
      "targetReps": 10, // Apenas para musculacao (inteiro)
      "targetWeight": 20 // Apenas para musculacao (número em kg)
    },
    {
      "name": "Corrida na Esteira",
      "type": "corrida",
      "targetDistance": 5, // Apenas para corrida (km - número) ou natacao (metros - número)
      "targetDuration": 30 // Apenas para corrida ou natacao (minutos - inteiro)
    }
  ]
}

Regras IMPORTANTES para o JSON:
1. NÃO adicione nenhum comentário ou texto adicional dentro das tags <workout_json>. Apenas o JSON válido.
2. Certifique-se de que os valores de 'type' sejam exatamente 'musculacao', 'corrida' ou 'natacao'.
3. Mantenha os nomes dos exercícios curtos e claros.
`;

export const sendMessageToGemini = async (chatHistory, apiKey) => {
  if (!apiKey) {
    throw new Error("API Key do Gemini não encontrada. Configure-a nas opções do chat.");
  }

  // Format history from local state structure into Gemini API structure
  // Local structure: [{ sender: 'user'|'ai', text: '...' }]
  // Gemini API structure: { contents: [{ role: 'user'|'model', parts: [{ text: '...' }] }] }
  const contents = chatHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || `Erro HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    throw new Error("Nenhum texto retornado pela API do Gemini.");
  }

  return textResponse;
};

// Extractor helper to parse <workout_json> tags
export const parseWorkoutFromResponse = (text) => {
  try {
    const regex = /<workout_json>([\s\S]*?)<\/workout_json>/i;
    const match = text.match(regex);
    if (match && match[1]) {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.exercises && parsed.exercises.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse workout JSON from Gemini response:", error);
  }
  return null;
};
