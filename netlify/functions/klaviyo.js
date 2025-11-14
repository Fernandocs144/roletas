exports.handler = async (event, context) => {
  try {
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
    // 1. CRIAR / ATUALIZAR PERFIL
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
    console.log("PROFILE TEXT:", await profileRes.text());

    // ============================
    // 2. ENVIAR EVENTO
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
            metric_id: "INSERE_AQUI_O_METRIC_ID",

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
    console.log("EVENT RESPONSE:", await eventRes.text());

    if (!eventRes.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Erro ao enviar evento" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error("ERRO GERAL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno", detail: error.message })
    };
  }
};
