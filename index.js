const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use("/", express.static("public"));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

app.post("/extract-file", async (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        return res.status(400).send("Nenhum arquivo enviado.");
    }

    try {
        const pdfFile = req.files.pdfFile;
        const result = await pdfParse(pdfFile.data); 
        const genAI = new GoogleGenerativeAI("AIzaSyDHwvo-DhnVeFyVC4xMCNOQn4w4rUS6d6E");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = "Traduza para portugues, me retorne apenas o texto sem dizer nada, identifique titulo, subtitulo, numero de pagina, capitulos, conteudo e formate o espaçamento e não retorne o numero das paginas. As vezes o numero da pagina pode estar antes do capitulo, verifique sempre" + result.text
        const translate = await model.generateContent(prompt);
        res.send(translate.response.text());
    } catch (error) {
        console.error("Erro ao processar o PDF:", error);
        res.status(500).send("Erro ao processar o arquivo.");
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
