exports.handler = async (event, context) => {
  try {
    // ============================
    // 1. LOG PARA DEPURAÇÃO
    // ============================
    console.log("KEY NETLIFY:", process.env.KLAVIYO_PRIVATE_KEY);

    const data = JSON.parse(event.body || "{}");
    console.log("DATA RECEBIDO:", data);

    const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY;

    if (!KLAVIYO_KEY) {
      console.error("❌ ERRO: KLAVIYO_PRIVATE_KEY não encontrada.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Klaviyo key missing" })
      };
    }

    // ============================
    // 2. CRIAR / ATUALIZAR PERFIL
    // ============================
    const profileRes = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_KEY}`,
        "Content-Type": "application/json",
        "revision": "2024-02-15"
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email: data.email,
            first_name: data.nome
          }
        }
      })
    });

    console.log("PROFILE STATUS:", profileRes.status);

    const profileText = await profileRes.text();
    console.log("PROFILE TEXT:", profileText);

    // ============================
    // 3. ENVIAR EVENTO FINAL
    // ============================
    const eventRes = await fetch("https://a.klaviyo.com/api/events/", {
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
            // 👉 CRIA AUTOMATICAMENTE A MÉTRICA SE NÃO EXISTIR
            metric: {
              name: "Roleta - Código Atribuído"
            },

            profile: {
              email: data.email
            },

            properties: {
              prize: data.premio || "",
              code: data.codigo || ""
            },

            time: Math.floor(Date.now() / 1000)
          }
        }
      })
    });

    console.log("EVENT STATUS:", eventRes.status);

    const eventText = await eventRes.text();
    console.log("EVENT RESPONSE:", eventText);

    if (!eventRes.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Erro ao enviar evento", detail: eventText })
      };
    }

    // ============================
    // 4. RETORNO FINAL
    // ============================
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Evento enviado com sucesso" })
    };

  } catch (error) {
    console.error("ERRO GERAL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno", detail: error.message })
    };
  }
};



