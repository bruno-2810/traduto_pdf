const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const PDFDocument = require("pdfkit");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require('dotenv').config()

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

app.post("/extract-file", async (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    try {
        const pdfFile = req.files.pdfFile;
        const result = await pdfParse(pdfFile.data);

        const genAI = new GoogleGenerativeAI(process.env.CHAVE); 
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = "Traduza para português e formate corretamente, ignore o número das páginas que podem aparecer em lugares diferentes, retorne sem mensagem extra, identifique os titulos com - e me mande apenas o conteúdo:\n\n" + result.text;

        const translate = await model.generateContent(prompt);
        const translatedText = translate.response.text();

        const doc = new PDFDocument();
        let pdfBuffer = [];

        doc.on("data", chunk => pdfBuffer.push(chunk));
        doc.on("end", () => {
            res.json({
                translatedText,
                pdfBase64: Buffer.concat(pdfBuffer).toString("base64")
            });
        });

        doc.fontSize(14).text(translatedText, { align: "left" });
        doc.end();
    } catch (error) {
        console.error("Erro ao processar o PDF:", error);
        res.status(500).json({ error: "Erro ao processar o arquivo." });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
