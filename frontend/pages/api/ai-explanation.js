// pages/api/ai-explanation.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing');
    return res.status(500).json({ 
      success: false, 
      error: 'API key not configured' 
    });
  }

  try {
    const { originalMedicine, alternative, commonIngredients } = req.body;

    if (!originalMedicine || !alternative) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const prompt = `You are a medical information assistant. Provide a brief, professional explanation (2-3 sentences) about why "${alternative.name}" is a suitable alternative to "${originalMedicine.name}".

Original Medicine: ${originalMedicine.name}
Composition: ${originalMedicine.composition}

Alternative Medicine: ${alternative.name}
Composition: ${alternative.composition}
Common Ingredients: ${commonIngredients && commonIngredients.length > 0 ? commonIngredients.join(', ') : 'None listed'}

Focus on: therapeutic equivalence, shared active ingredients, and any key differences. Keep it concise and patient-friendly. Do not use markdown formatting.`;

    // Use v1beta with gemini-flash-latest (the working model)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    console.log('Sending request to Gemini...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (response.ok && data.candidates && data.candidates[0]) {
      const explanation = data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini response received');
      
      return res.status(200).json({ 
        success: true, 
        explanation 
      });
    } else {
      console.error('Gemini API Error:', data);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate explanation',
        details: data.error?.message || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ AI Explanation Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate explanation',
      details: error.message 
    });
  }
}
