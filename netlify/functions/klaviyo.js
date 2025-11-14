exports.handler = async (event) => {
  const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY;

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  const data = JSON.parse(event.body || "{}");

  console.log("KEY NETLIFY:", KLAVIYO_KEY);
  console.log("DATA RECEBIDO:", data);

  if (!data.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email em falta" })
    };
  }

  try {
    // 1️⃣ Criar / actualizar perfil no Klaviyo
    const profileResponse = await fetch("https://a.klaviyo.com/api/profiles/", {
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
            first_name: data.nome || "",
            properties: {
              prize: data.premio || "",
              code: data.codigo || ""
            }
          }
        }
      })
    });

    console.log("PROFILE STATUS:", profileResponse.status);
    console.log("PROFILE TEXT:", await profileResponse.text());

    // 2️⃣ Disparar evento “Roleta - Código Atribuído”
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
            metric: { name: "Roleta - Código Atribuído" },
            customer_properties: { email: data.email },
            properties: {
              prize: data.premio || "",
              code: data.codigo || ""
            },
            time: Math.floor(Date.now() / 1000)
          }
        }
      })
    });

    console.log("EVENT STATUS:", eventResponse.status);
    console.log("EVENT RESPONSE:", await eventResponse.text());

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Erro Klaviyo:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

