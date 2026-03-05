// test-gemini-v1beta.js
async function test() {
  const API_KEY = "AIzaSyCpJVkTNnqvIf_H6ETkqEmY8YobABM3iOs";
  
  // Updated model names (use current aliases)
  const models = [
    "gemini-flash-latest",      // replaces gemini-1.5-flash
    "gemini-pro-latest",         // replaces gemini-1.5-pro and gemini-pro
    "gemini-2.0-flash-exp"       // newer experimental model
  ];

  // Rest of your code remains the same
  for (const modelName of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const body = {
      contents: [{
        parts: [{
          text: "Say hello in one sentence."
        }]
      }]
    };

    try {
      console.log(`\nTrying v1beta with model: ${modelName}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (response.ok && data.candidates) {
        console.log(`✅ SUCCESS with: ${modelName}`);
        console.log('Response:', data.candidates[0].content.parts[0].text);
        return;
      } else {
        console.log(`❌ Failed (${response.status}):`, data.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.log(`❌ Network Error:`, error.message);
    }
  }
  
  console.log('\n⚠️ None of the models worked. Your API key might need to be regenerated or enabled for Gemini.');
}

test();
