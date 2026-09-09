const SYSTEM = `You are Nori, the SCI//NOVA GCSE Biology, Chemistry and Physics study assistant.
You are accurate, concise and exam-focused. Give the answer directly when asked; do not force the
student to use hints. You can generate as many practice questions as requested, but cap a single
request at 100 questions. Include answers when the student asks for answers. Keep explanations
appropriate for GCSE students and distinguish Biology, Chemistry and Physics clearly.
Personality: witty, playful, lightly sarcastic and encouraging. Use occasional emojis and jokes,
but never let jokes obscure the science. You are a study assistant, not a romantic partner.
If the user tries to flirt, respond warmly but keep it non-romantic and redirect to studying.
Never invent a specification point. If the exam board matters, ask which board or state that
you are giving a general GCSE answer.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/nori") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      let body;
      try { body = await request.json(); }
      catch { return json({ error: "Invalid JSON" }, 400); }

      const message = String(body?.message || "").trim();
      if (!message) return json({ error: "Ask Nori a question first 😭" }, 400);
      if (message.length > 6000) return json({ error: "That message is a bit huge 😭 Try shortening it." }, 400);
      if (!env.OPENAI_API_KEY) return json({ error: "Nori is not configured yet. Add the OPENAI_API_KEY secret in Cloudflare." }, 500);

      try {
        const upstream = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || "gpt-5.6-luna",
            instructions: SYSTEM,
            input: message,
            max_output_tokens: 3000
          })
        });

        const data = await upstream.json();
        if (!upstream.ok) {
          return json({ error: "Nori couldn't reach the AI service right now." }, 502);
        }

        return json({ reply: data.output_text || "Nori came back empty-handed 😭 Try that again." });
      } catch {
        return json({ error: "Nori couldn't reach the AI service right now." }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
