function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function text(message, status = 400) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}

function normalizeDebt(input, id) {
  const now = new Date().toISOString();
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const amount = Number(input.amount) || 0;

  if (!id) throw new Error("Missing debt id.");
  if (!name) throw new Error("Name is required.");
  if (!description) throw new Error("Description is required.");
  if (amount <= 0) throw new Error("Amount must be greater than zero.");

  return {
    id,
    name,
    description,
    amount,
    date: String(input.date || "").trim(),
    due: String(input.due || "").trim(),
    minimumDue: Math.max(0, Number(input.minimumDue) || 0),
    billingCycle: input.billingCycle === "15-30" ? "15-30" : "monthly",
    notes: String(input.notes || "").trim(),
    payments: Array.isArray(input.payments)
      ? input.payments.map((payment) => ({
          amount: Math.max(0, Number(payment.amount) || 0),
          date: String(payment.date || "").trim(),
          note: String(payment.note || "").trim()
        })).filter((payment) => payment.amount > 0)
      : [],
    createdAt: String(input.createdAt || now),
    updatedAt: now
  };
}

export async function onRequestPut({ request, env, params }) {
  try {
    const id = decodeURIComponent(params.id);
    const debt = normalizeDebt(await request.json(), id);
    await env.DB
      .prepare(`
        INSERT INTO debts (id, data, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      `)
      .bind(debt.id, JSON.stringify(debt), debt.createdAt, debt.updatedAt)
      .run();
    return json(debt);
  } catch (error) {
    return text(error.message, 400);
  }
}

export async function onRequestDelete({ env, params }) {
  const id = decodeURIComponent(params.id);
  await env.DB.prepare("DELETE FROM debts WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
}
