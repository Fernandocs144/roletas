// netlify/functions/klaviyo.js

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY;
  const data = JSON.parse(event.body || "{}");

  if (!data.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email em falta" })
    };
  }

  try {
    // 1️⃣ Criar / actualizar perfil no Klaviyo
    await fetch("https://a.klaviyo.com/api/profiles/", {
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

    // 2️⃣ Disparar evento “Roleta - Código Atribuído”
    await fetch("https://a.klaviyo.com/api/events/", {
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
