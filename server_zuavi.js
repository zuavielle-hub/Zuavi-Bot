const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Inicializar Gemini (puedes poner tu clave aquí o dejar que Render la lea de forma segura)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'TU_API_KEY_AQUI' });

app.post('/whatsapp-webhook', async (req, res) => {
    const incomingMsg = req.body.Body;
    const senderID = req.body.From;
    
    console.log(`Mensaje recibido de ${senderID}: ${incomingMsg}`);

    const twiml = new MessagingResponse();

    try {
        // Llamada a la IA con la personalidad y contexto de Zuavi
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Eres Zuavi, el asistente virtual empático, cálido y profesional de la tienda artesanal Zuavielle (zuavielle.cl). Responde de forma cercana, tierna y usa emojis sutiles a este mensaje de un cliente: "${incomingMsg}"`,
        });

        const replyText = response.text || "¡Hola! Gracias por escribir a Zuavielle. ¿En qué te podemos ayudar?";
        twiml.message(replyText);

    } catch (error) {
        console.error("Error al conectar con Gemini:", error);
        twiml.message("¡Hola! En este momento estamos atendiendo muchos pedidos, pero ya tomamos nota de tu mensaje. ¡Un abrazo! 🌸");
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Zuavi corriendo en el puerto ${PORT}`);
});