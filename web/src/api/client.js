const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function api(path, { method = "GET", body, token } = {}) {
  const url = `${BASE_URL}${path}`;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}), // ✅ só quando tem body
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${url} → ${data?.error || "Erro"}`);
  }

  return data;
}