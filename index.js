import 'dotenv/config';
import express, { response } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({apiKey: process.env.GoogleGenAI});
const model = 'gemini-3.5-flash-lite';

app.use(express.json());

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Belajar AI bersama Hactive8!');
});

app.post('/generate-text', async (req, res) => {
    try {
        const {prompt} = req.body;

        const response = await ai.models.generateContent({
            model,
            contents: prompt
        })
        res.status(200).json({result: response.text});
    } catch (error) {
      console.error('Error generating text:', error);
      res.status(500).json({
            error: `Something went wrong while generating text.`,
        });
    }  
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try{
        const {prompt} = req.body;
        const base64Image = req.file.buffer.toString('base64');

        const response = await ai.models.generateContent({
            model,
            contents:[
                {text: prompt, type: 'text'},
                {inlineData: {data: base64Image, mimeType: req.file.mimetype}}
            ],
        });

        res.status(200).json({result: response.text});
    } catch(error) {
      console.error('Error generating text:', error);
      res.status(500).json({
            error: `Something went wrong while generating text.`,
        }); 
    }
})

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    try{
        const {prompt} = req.body;
        const base64Document = req.file.buffer.toString('base64');

        const response = await ai.models.generateContent({
            model,
            contents:[
                {text: prompt ?? 'Tolong buatkan kesimpulan dari dokumen berikut.', type: 'text'},
                {inlineData: {data: base64Document, mimeType: req.file.mimetype}}
            ],
        });

        res.status(200).json({result: response.text});
    } catch(error) {
      console.error('Error generating text:', error);
      res.status(500).json({
            error: `Something went wrong while generating text.`,
        }); 
    }
})

app.listen(PORT, () => 
    console.log(`Server ready on port ${PORT}`)
);
