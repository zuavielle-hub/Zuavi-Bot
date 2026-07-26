const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());
app.use(cors());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const ZUAVI_SYSTEM_INSTRUCTION = `
Eres Zuavi, la asistente virtual de Zuavielle, una tienda de productos artesanales. 
Tu tono es siempre cálido, empático, muy amable y servicial. Ayudas a los clientes a conocer 
los productos, resolver dudas sobre los envíos y orientarlos en su compra dentro de la web.
Si un cliente te pide explícitamente hablar con un humano, con una persona real, o muestra 
mucha frustración, indícale amablemente que ya has notificado al equipo humano y que pronto se comunicarán con él.
`;

app.get('/', (req, res) => {
    res.send('¡El servidor web de Zuavi está activo y funcionando en la nube!');
});

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message || '';
        const userEmail = req.body.email || 'No proporcionado';

        if (!userMessage) {
            return res.status(400).json({ reply: 'Por favor, escribe un mensaje.' });
        }

        const lowerMsg = userMessage.toLowerCase();
        const needsHuman = lowerMsg.includes('humano') || 
                           lowerMsg.includes('persona') || 
                           lowerMsg.includes('asesor') || 
                           lowerMsg.includes('ayuda real') || 
                           lowerMsg.includes('soporte');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: ZUAVI_SYSTEM_INSTRUCTION,
                temperature: 0.7,
            }
        });

        let botReply = response.text || 'Lo siento, no pude procesar tu consulta en este momento, pero haré que te contactemos pronto.';

        if (needsHuman) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: '🚨 ¡Un cliente en la web de Zuavielle necesita un humano!',
                text: `Hola.\n\nUn cliente ha solicitado asistencia humana en el chat de la web.\n\n- Correo/Contacto del cliente: ${userEmail}\n- Último mensaje del cliente: "${userMessage}"\n\nPor favor, ingresa a WordPress o revisa el panel para atenderlo.`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar la alerta por correo:', error);
                } else {
                    console.log('Alerta por correo enviada con éxito:', info.response);
                }
            });

            botReply += "\n\n*(He notificado a nuestro equipo humano sobre tu solicitud. Te contactaremos muy pronto)*";
        }

        res.json({ reply: botReply });

    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ reply: 'Ocurrió un error temporal en el servidor. Inténtalo de nuevo en unos segundos.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Zuavi corriendo en el puerto ${PORT}`);
});
