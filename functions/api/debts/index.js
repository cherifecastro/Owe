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

function normalizeDebt(input) {
  const now = new Date().toISOString();
  const id = String(input.id || "").trim();
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

export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare("SELECT data FROM debts ORDER BY created_at DESC")
    .all();
  return json(results.map((row) => JSON.parse(row.data)));
}

export async function onRequestPost({ request, env }) {
  try {
    const debt = normalizeDebt(await request.json());
    await env.DB
      .prepare("INSERT INTO debts (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .bind(debt.id, JSON.stringify(debt), debt.createdAt, debt.updatedAt)
      .run();
    return json(debt, { status: 201 });
  } catch (error) {
    return text(error.message, 400);
  }
}
