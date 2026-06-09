const BASE = "/api";

function getToken() {
  try {
    const s = JSON.parse(localStorage.getItem("launchlab-store") || "{}");
    return s?.state?.token || null;
  } catch { return null; }
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body)  => request("POST", "/auth/register", body),
    login:    (body)  => request("POST", "/auth/login", body),
    me:       ()      => request("GET",  "/auth/me"),
    update:   (body)  => request("PUT",  "/auth/me", body),
  },

  // ── BUSINESSES ──────────────────────────────────────────────────────────────
  businesses: {
    list:    ()        => request("GET",    "/businesses"),
    get:     (id)      => request("GET",    `/businesses/${id}`),
    create:  (body)    => request("POST",   "/businesses", body),
    update:  (id, b)   => request("PUT",    `/businesses/${id}`, b),
    delete:  (id)      => request("DELETE", `/businesses/${id}`),
    outputs: (id)      => request("GET",    `/businesses/${id}/outputs`),
  },

  // ── TASKS ────────────────────────────────────────────────────────────────────
  tasks: {
    list:   (bizId)       => request("GET",    `/tasks/business/${bizId}`),
    create: (bizId, body) => request("POST",   `/tasks/business/${bizId}`, body),
    update: (id, body)    => request("PUT",    `/tasks/${id}`, body),
    delete: (id)          => request("DELETE", `/tasks/${id}`),
    run:    (id)          => request("POST",   `/tasks/${id}/run`),
    bulk:   (bizId, tasks)=> request("POST",   `/tasks/business/${bizId}/bulk`, { tasks }),
  },

  // ── GENERATION ───────────────────────────────────────────────────────────────
  generate: {
    ideas:          (intake)           => request("POST", "/generate/ideas",           { intake }),
    tasks:          (idea, intake, id) => request("POST", "/generate/tasks",           { idea, intake, businessId: id }),
    website:        (businessId)       => request("POST", "/generate/website",         { businessId }),
    businessPlan:   (businessId)       => request("POST", "/generate/business-plan",   { businessId }),
    socialContent:  (businessId)       => request("POST", "/generate/social-content",  { businessId }),
    emailTemplates: (businessId)       => request("POST", "/generate/email-templates", { businessId }),
    chat:           (message, bizId)   => request("POST", "/generate/chat",            { message, businessId: bizId }),
  },

  // ── INTEGRATIONS ─────────────────────────────────────────────────────────────
  integrations: {
    list:       (bizId) => request("GET",  `/integrations/${bizId}`),
    stripe:     (bizId) => request("POST", `/integrations/${bizId}/stripe`),
    googleAuth: (bizId) => request("GET",  `/integrations/google/auth?businessId=${bizId}`),
    disconnect: (bizId, provider) => request("POST", `/integrations/${bizId}/${provider}/disconnect`),
  },
};
