const fetch = require('node-fetch'); // Certifique-se de que 'node-fetch' está disponível no seu ambiente Netlify

exports.handler = async (event) => {
  // ⚠️ Use sempre uma Private API Key com permissões write/full access
  const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY;

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido. Apenas POST." })
    };
  }

  const data = JSON.parse(event.body || "{}");

  console.log("KEY NETLIFY:", KLAVIYO_KEY);
  console.log("DATA RECEBIDO:", data);

  if (!data.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email em falta no corpo da requisição." })
    };
  }

  try {
    // --- 1️⃣ Criar / actualizar perfil no Klaviyo (CORRIGIDO) ---
    // Propriedades customizadas (prize e code) movidas para o objeto 'attributes'
    const profileResponse = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_KEY}`,
        "Content-Type": "application/json",
        // Revisão para usar a versão mais recente da API
        "revision": "2024-02-15" 
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email: data.email,
            first_name: data.nome || "",
            // Propriedades customizadas a nível do perfil:
            prize: data.premio || "", 
            code: data.codigo || "" 
          }
        }
      })
    });

    const profileText = await profileResponse.text();
    console.log("PROFILE STATUS:", profileResponse.status);
    console.log("PROFILE TEXT:", profileText);
    
    if (!profileResponse.ok) {
        // Lança um erro para ser capturado no bloco 'catch'
        throw new Error(`Klaviyo Profile API Error (Status ${profileResponse.status}): ${profileText}`);
    }


    // --- 2️⃣ Disparar evento “Roleta - Código Atribuído” (CORRIGIDO) ---
    // Estrutura V3 completa, usando 'profile' para identificação e 'time' no formato ISO 8601
    const eventResponse = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_KEY}`,
        "Content-Type": "application/json",
        "revision": "2024-02-15"
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            // METRIC: Define o nome da sua métrica
            metric: { 
                data: {
                    type: "metric",
                    attributes: {
                        name: "Roleta - Código Atribuído" 
                    }
                }
            },
            // PROFILE: Identifica o usuário associado ao evento
            profile: { 
                data: {
                    type: "profile",
                    attributes: {
                        email: data.email
                    }
                }
            },
            // PROPERTIES: Dados específicos que você quer anexar a este evento
            properties: { 
              prize: data.premio || "",
              code: data.codigo || ""
            },
            // TIME: Formato ISO 8601 (Ex: "2025-11-14T12:00:00Z")
            time: new Date().toISOString()
          }
        }
      })
    });

    const eventText = await eventResponse.text();
    console.log("EVENT STATUS:", eventResponse.status);
    console.log("EVENT RESPONSE:", eventText);

    if (!eventResponse.ok) {
        throw new Error(`Klaviyo Event API Error (Status ${eventResponse.status}): ${eventText}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Perfil e Evento Klaviyo enviados com sucesso!" })
    };

  } catch (err) {
    console.error("Erro na comunicação com o Klaviyo:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno do servidor ao processar Klaviyo", details: err.message })
    };
  }
};

