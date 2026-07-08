const BASE = "/api";
function getToken() {
  try { return JSON.parse(localStorage.getItem("earnedlab")||"{}").state?.token||null; } catch { return null; }
}
async function req(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) },
    ...(body!==undefined?{body:JSON.stringify(body)}:{}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||`Request failed (${res.status})`);
  return data;
}
export const api = {
  auth: {
    register:           b       => req("POST", "/auth/register", b),
    login:              b       => req("POST", "/auth/login", b),
    me:                 ()      => req("GET",  "/auth/me"),
    update:             b       => req("PUT",  "/auth/me", b),
    simulatePlan:       simulatedPlan => req("PUT", "/auth/admin/simulate", { simulatedPlan }),
    verifyEmail:        token   => req("GET",  `/auth/verify-email?token=${token}`),
    resendVerification: ()      => req("POST", "/auth/resend-verification"),
    forgotPassword:     email   => req("POST", "/auth/forgot-password", { email }),
    resetPassword:      (token, password) => req("POST", "/auth/reset-password", { token, password }),
  },
  businesses: {
    list:    ()       => req("GET",    "/businesses"),
    get:     id       => req("GET",    `/businesses/${id}`),
    create:  b        => req("POST",   "/businesses", b),
    update:  (id,b)   => req("PUT",    `/businesses/${id}`, b),
    delete:  id       => req("DELETE", `/businesses/${id}`),
    outputs: id       => req("GET",    `/businesses/${id}/outputs`),
  },
  tasks: {
    list:   bizId         => req("GET",    `/tasks/business/${bizId}`),
    create: (bizId,b)     => req("POST",   `/tasks/business/${bizId}`, b),
    update: (id,b)        => req("PUT",    `/tasks/${id}`, b),
    delete: id            => req("DELETE", `/tasks/${id}`),
    run:    (id, body={}) => req("POST",   `/tasks/${id}/run`, body),
    bulk:   (bizId,tasks) => req("POST",   `/tasks/business/${bizId}/bulk`, { tasks }),
  },
  generate: {
    ideas:          intake => req("POST", "/generate/ideas",           { intake }),
    tasks:          (idea,intake,id) => req("POST", "/generate/tasks", { idea, intake, businessId:id }),
    website:        id => req("POST", "/generate/website",         { businessId:id }),
    businessPlan:   id => req("POST", "/generate/business-plan",   { businessId:id }),
    socialContent:  id => req("POST", "/generate/social-content",  { businessId:id }),
    emailTemplates: id => req("POST", "/generate/email-templates", { businessId:id }),
    chat:           (msg,bizId) => req("POST", "/generate/chat",   { message:msg, businessId:bizId }),
  },
  integrations: {
    list:          bizId            => req("GET",  `/integrations/${bizId}`),
    stripe:        bizId            => req("POST", `/integrations/${bizId}/stripe`),
    googleAuth:    bizId            => req("GET",  `/integrations/google/auth?businessId=${bizId}`),
    twitterAuth:   bizId            => req("GET",  `/integrations/twitter/auth?businessId=${bizId}`),
    tiktokAuth:    bizId            => req("GET",  `/integrations/tiktok/auth?businessId=${bizId}`),
    testWordPress: (bizId, fields)  => req("POST", `/integrations/${bizId}/wordpress/test`, fields),
    disconnect:    (bizId,p)        => req("POST", `/integrations/${bizId}/${p}/disconnect`),
    saveFields:    (bizId,p,fields) => req("PUT",  `/integrations/${bizId}/${p}`, { fields }),
  },

  instagram: {
    profile:        bizId               => req("GET",  `/instagram/${bizId}/profile`),
    insights:       (bizId,days=30)     => req("GET",  `/instagram/${bizId}/insights?days=${days}`),
    media:          (bizId,limit=12)    => req("GET",  `/instagram/${bizId}/media?limit=${limit}`),
    comments:       (bizId,mediaId)     => req("GET",  `/instagram/${bizId}/media/${mediaId}/comments`),
    replyComment:   (bizId,commentId,message) => req("POST", `/instagram/${bizId}/comments/${commentId}/reply`, { message }),
    hideComment:    (bizId,commentId,hide)    => req("POST", `/instagram/${bizId}/comments/${commentId}/hide`, { hide }),
    createPost:     (bizId,imageUrl,caption)  => req("POST", `/instagram/${bizId}/post`, { imageUrl, caption }),
    generateCaption:(bizId,context,tone)      => req("POST", `/instagram/${bizId}/generate-caption`, { context, tone }),
    generateReply:  (bizId,commentText,postContext) => req("POST", `/instagram/${bizId}/generate-reply`, { commentText, postContext }),
    act:            (bizId,insight,autopilot,imageUrl) => req("POST", `/instagram/${bizId}/act`, { insight, autopilot, imageUrl }),
    uploadImage:    async (file) => {
      const token = getToken();
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${BASE}/instagram/images/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      return data;
    },
  },
  twitter: {
    profile: bizId         => req("GET",  `/twitter/${bizId}/profile`),
    tweets:  (bizId,limit) => req("GET",  `/twitter/${bizId}/tweets?limit=${limit||10}`),
    post:    (bizId,text)  => req("POST", `/twitter/${bizId}/post`, { text }),
  },
  tiktok: {
    profile:   bizId                   => req("GET",  `/tiktok/${bizId}/profile`),
    videos:    (bizId,limit)           => req("GET",  `/tiktok/${bizId}/videos?limit=${limit||10}`),
    post:      (bizId,caption,imgUrls) => req("POST", `/tiktok/${bizId}/post`, { caption, imageUrls: imgUrls }),
  },
  email: {
    stats:    bizId               => req("GET",  `/email/${bizId}/stats`),
    send:     (bizId,body)        => req("POST", `/email/${bizId}/send`, body),
    generate: (bizId,context,type)=> req("POST", `/email/${bizId}/generate`, { context, type }),
  },
  subscriptions: {
    plans:    () => req("GET",  "/subscriptions/plans"),
    me:       () => req("GET",  "/subscriptions/me"),
    checkout: planId => req("POST", "/subscriptions/checkout", { planId }),
    portal:   () => req("POST", "/subscriptions/portal"),
  },
  agents: {
    runMarketing:      (bizId,mode)     => req("POST", `/agents/${bizId}/marketing/run`, { mode }),
    savedInsights:     bizId           => req("GET",  `/agents/${bizId}/marketing/insights`),
    implement:         (bizId,insight,mode)  => req("POST", `/agents/${bizId}/management/implement`, { insight, mode }),
    campaignBreakdown: (bizId,campaign)      => req("POST", `/agents/${bizId}/campaigns/breakdown`, { campaign }),
    taskContent:       (bizId,task,channel,mode) => req("POST", `/agents/${bizId}/campaigns/task-content`, { task, channel, mode }),
    notes:             bizId                 => req("GET",  `/agents/${bizId}/marketing/notes`),
    addNote:           (bizId,text,color)    => req("POST", `/agents/${bizId}/marketing/notes`, { text, color }),
    deleteNote:        (bizId,noteId)        => req("DELETE", `/agents/${bizId}/marketing/notes/${noteId}`),
    activity:     bizId         => req("GET",  `/agents/${bizId}/activity`),
    access:       bizId         => req("GET",  `/agents/${bizId}/access`),
    getAutopilot: bizId         => req("GET",  `/agents/${bizId}/autopilot`),
    setAutopilot: (bizId,enabled)=> req("POST", `/agents/${bizId}/autopilot`, { enabled }),
    deployStatus: bizId         => req("GET",  `/agents/${bizId}/deploy-status`),
    resetUsage:   bizId         => req("DELETE", `/agents/${bizId}/usage`),
    getBrandIdentity:      bizId            => req("GET",  `/agents/${bizId}/brand-identity`),
    saveBrandIdentity:     (bizId,identity) => req("PUT",  `/agents/${bizId}/brand-identity`, { identity }),
    populateBrandIdentity: bizId            => req("POST", `/agents/${bizId}/brand-identity/populate`),
    contentLab:            (bizId,body)     => req("POST", `/agents/${bizId}/content-lab`, body),
  },
  metrics: {
    get:     bizId          => req("GET", `/metrics/${bizId}`),
    save:    (bizId,data)   => req("PUT", `/metrics/${bizId}`, data),
    suggest: (bizId,question,prefs)=>req("POST",`/metrics/${bizId}/suggest`, { question, prefs }),
  },
};
