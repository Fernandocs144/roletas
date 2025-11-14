const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  console.log("FUNÇÃO KLAVIYO A CORRER!");
  console.log("BODY RECEBIDO:", event.body);

  try {
    // Garantir que temos body
    if (!event.body) {
      console.log("ERRO: event.body vazio");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Body vazio" })
      };
    }

    const data = JSON.parse(event.body);
    console.log("JSON PARSED:", data);

    // Verificar email (obrigatório)
    if (!data.email) {
      console.log("ERRO: Email em falta");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email é obrigatório" })
      };
    }

    const KLAVIYO_KEY = process.env.KLAVIYO_KEY;
    console.log("USING KLAVIYO KEY:", KLAVIYO_KEY ? "OK" : "NÃO DEFINIDA");

    // Construção do payload para Klaviyo
    const payload = {
      data: {
        type: "profile",
        attributes: {
          email: data.email,
          first_name: data.nome || "",
          properties: {
            prize: data.premio || "",
            code: data.codigo || ""
          }
        }
      }
    };

    console.log("PAYLOAD PARA KLAVIYO:", JSON.stringify(payload, null, 2));

    // Chamada à API da Klaviyo
    console.log("A ENVIAR PARA KLAVIYO...");

    const response = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_KEY}`,
        "Content-Type": "application/json",
        revision: "2024-02-15"
      },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();

    console.log("RESPOSTA KLAVIYO:", resultText);

    return {
      statusCode: response.status,
      body: resultText
    };

  } catch (error) {
    console.log("ERRO GERAL NA FUNÇÃO:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro interno na função",
        detalhes: error.message
      })
    };
  }
};
