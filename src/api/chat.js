// Gatsby Serverless Function: POST /api/chat
// Proxies messages securely to Google Gemini API using server-side keys

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

export default async function handler(req, res) {
  // Enforce POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history } = req.body;
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid or missing chat history' });
  }

  // Load API Key securely from Server Environment Variables
  const apiKey = process.env.GEMINI_API_KEY || process.env.GATSBY_GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY") {
    return res.status(500).json({ 
      error: 'API Key do Gemini não está configurada no servidor. Por favor, adicione a variável de ambiente GEMINI_API_KEY nas configurações do Netlify.' 
    });
  }

  try {
    // Map local history to Gemini API structure
    const contents = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(url, {
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

    if (!apiResponse.ok) {
      const errData = await apiResponse.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Erro HTTP ${apiResponse.status}`;
      return res.status(apiResponse.status).json({ error: errMsg });
    }

    const data = await apiResponse.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return res.status(500).json({ error: 'Nenhum texto retornado pela API do Gemini.' });
    }

    return res.status(200).json({ text: textResponse });

  } catch (error) {
    console.error('Error in chat serverless function:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
