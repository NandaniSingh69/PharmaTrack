// list-models.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const API_KEY = "AIzaSyAoK9BZY--JPIE6A36lDY2Cfq8-ZZ4KFp4";
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  try {
    const models = await genAI.listModels();
    console.log('Available models:');
    models.forEach(model => {
      console.log(`- ${model.name}`);
    });
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
