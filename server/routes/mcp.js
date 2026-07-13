/**
 * EarnedLab MCP Server — JSON-RPC 2.0 over HTTP
 * Protocol version: 2024-11-05
 *
 * Endpoints:
 *   GET  /api/mcp          → server info
 *   POST /api/mcp          → JSON-RPC handler (MCP messages)
 *
 * Authentication:
 *   Read-only tools: no auth required
 *   Write tools (create_earnedlab_workspace, update_business_workspace):
 *     Authorization: Bearer <earnedlab-jwt>
 */

const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const { executeTool, READ_TOOLS, WRITE_TOOLS } = require("../services/mcpTools");

const MCP_VERSION = "2024-11-05";

// ── JSON Schema for each tool's inputs ────────────────────────────────────

const TOOL_DEFS = [
  {
    name: "discover_business_opportunities",
    description: "Use when a person wants realistic business directions based on their skills, experience, interests, budget, available time, location constraints, and income goals. Returns a structured shortlist with fit rationale, assumptions, risks, and next validation steps. Do not use to promise rapid or guaranteed income.",
    inputSchema: {
      type: "object",
      properties: {
        skills:               { type: "string", description: "Skills and abilities the person has" },
        experience:           { type: "string", description: "Professional or life experience" },
        interests:            { type: "string", description: "Topics or areas the person is interested in" },
        budget:               { type: "string", description: "Starting budget available (e.g. '$500', 'none', 'under $2,000')" },
        hours_per_week:       { type: "string", description: "Hours available per week for the business" },
        location_constraints: { type: "string", description: "Geographic or remote work constraints" },
        income_goal:          { type: "string", description: "Income goal and timeline (e.g. '$2,000/month in 6 months')" },
        risk_tolerance:       { type: "string", description: "Risk appetite: low, moderate, or high" },
      },
      required: ["skills"],
    },
  },
  {
    name: "validate_business_idea",
    description: "Use when a user has a specific business idea and wants to evaluate the customer problem, target market, competitors, differentiation, feasibility, evidence gaps, and next experiments before investing heavily.",
    inputSchema: {
      type: "object",
      properties: {
        idea:            { type: "string", description: "The business idea to validate" },
        target_customer: { type: "string", description: "Who the intended customer is" },
        location:        { type: "string", description: "Geographic market" },
        budget:          { type: "string", description: "Budget available for launch and testing" },
        constraints:     { type: "string", description: "Time, skill, or other constraints" },
        known_evidence:  { type: "string", description: "What the person already knows or has researched" },
      },
      required: ["idea"],
    },
  },
  {
    name: "analyze_market",
    description: "Use when a user wants a structured market and competitor analysis for a proposed or existing business. Separates sourced facts, user-provided information, estimates, and assumptions.",
    inputSchema: {
      type: "object",
      properties: {
        business_description: { type: "string", description: "What the business does and who it serves" },
        target_customer:      { type: "string", description: "Target customer description" },
        geography:            { type: "string", description: "Market geography (city, region, country, or online)" },
        competitors:          { type: "string", description: "Known competitors (optional)" },
        research_question:    { type: "string", description: "Specific question to answer with the analysis" },
      },
      required: ["business_description"],
    },
  },
  {
    name: "create_business_launch_plan",
    description: "Use when a user has selected a business direction and wants a staged launch plan with milestones, tasks, dependencies, budget assumptions, and validation checkpoints.",
    inputSchema: {
      type: "object",
      properties: {
        business_direction: { type: "string", description: "The chosen business type and direction" },
        target_customer:    { type: "string", description: "Target customer" },
        offer:              { type: "string", description: "What the business offers and at what price" },
        budget:             { type: "string", description: "Available starting budget" },
        launch_date:        { type: "string", description: "Target launch date or timeframe" },
        hours_per_week:     { type: "string", description: "Hours available per week" },
        constraints:        { type: "string", description: "Known constraints" },
      },
      required: ["business_direction"],
    },
  },
  {
    name: "create_marketing_strategy",
    description: "Use when a new or existing business needs positioning, messaging, channel priorities, campaign ideas, and an execution plan tied to a defined audience and offer.",
    inputSchema: {
      type: "object",
      properties: {
        business_context: { type: "string", description: "Business description, offer, and current situation" },
        audience:         { type: "string", description: "Target audience description" },
        offer:            { type: "string", description: "What the business sells and at what price" },
        goals:            { type: "string", description: "Marketing goals (e.g. '5 new clients in 60 days')" },
        budget:           { type: "string", description: "Marketing budget" },
        channels:         { type: "string", description: "Preferred or available channels" },
        brand_voice:      { type: "string", description: "Brand voice and tone description" },
      },
      required: ["business_context", "audience"],
    },
  },
  {
    name: "create_content_plan",
    description: "Use when a business needs a coordinated content strategy and calendar grounded in its audience, offer, brand voice, goals, and available production capacity.",
    inputSchema: {
      type: "object",
      properties: {
        business_context: { type: "string", description: "Business description and current situation" },
        audience:         { type: "string", description: "Target audience" },
        offer:            { type: "string", description: "What the business sells" },
        goals:            { type: "string", description: "Content goals" },
        brand_voice:      { type: "string", description: "Brand voice and tone" },
        channels:         { type: "string", description: "Channels to create content for" },
        cadence:          { type: "string", description: "Publishing frequency (e.g. 'daily on Instagram, weekly newsletter')" },
      },
      required: ["business_context", "channels"],
    },
  },
  {
    name: "audit_business_operations",
    description: "Use when an existing business owner wants to identify bottlenecks, repetitive work, unclear ownership, disconnected tools, missing procedures, and responsible automation opportunities.",
    inputSchema: {
      type: "object",
      properties: {
        business_context: { type: "string", description: "What the business does and how it currently operates" },
        team:             { type: "string", description: "Team size and roles (use 'solo founder' if applicable)" },
        workflows:        { type: "string", description: "Current workflows or processes to audit" },
        tools:            { type: "string", description: "Tools and software currently in use" },
        pain_points:      { type: "string", description: "Known problems, slowdowns, or frustrations" },
        constraints:      { type: "string", description: "Budget, time, or team constraints on changes" },
      },
      required: ["business_context"],
    },
  },
  {
    name: "create_earnedlab_workspace",
    description: "Use after a user chooses to continue a business plan in EarnedLab. Creates a workspace from approved business context. Requires authentication and explicit user confirmation because it writes user data.",
    inputSchema: {
      type: "object",
      properties: {
        approved_business_context: {
          type: "object",
          description: "The approved business context — name, description, offer, target customer, location, budget, hours per week",
        },
        selected_plan: {
          type: "object",
          description: "The plan the user approved — milestones, tasks, and first steps",
        },
        workspace_name: { type: "string", description: "Name for the workspace (usually the business name)" },
      },
      required: ["approved_business_context", "workspace_name"],
    },
  },
  {
    name: "update_business_workspace",
    description: "Use to add approved plans, tasks, findings, or content to an authenticated user's existing EarnedLab workspace. Require confirmation before writes. Never overwrite user work silently.",
    inputSchema: {
      type: "object",
      properties: {
        workspace_id: { type: "string", description: "The EarnedLab workspace (business) ID" },
        approved_changes: {
          type: "object",
          description: "The changes the user approved — can be plan updates, new tasks, content, or findings",
        },
        target_sections: {
          type: "array",
          items: { type: "string" },
          description: "Which sections to update (e.g. ['Business plan', 'Tasks'])",
        },
      },
      required: ["workspace_id", "approved_changes"],
    },
  },
];

// ── Auth helper ────────────────────────────────────────────────────────────

function getUserIdFromHeader(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return payload.userId || null;
  } catch {
    return null;
  }
}

// ── JSON-RPC helpers ───────────────────────────────────────────────────────

function ok(id, result) {
  return { jsonrpc: "2.0", result, id };
}

function err(id, code, message) {
  return { jsonrpc: "2.0", error: { code, message }, id };
}

// ── GET /api/mcp — server info ─────────────────────────────────────────────

router.get("/", (req, res) => {
  res.json({
    name:            "EarnedLab",
    description:     "AI business operating system for entrepreneurs, solo founders, and small-business owners.",
    mcp_version:     MCP_VERSION,
    endpoint:        "https://www.earnedlab.com/api/mcp",
    docs:            "https://www.earnedlab.com/docs/api-mcp.md",
    tools:           TOOL_DEFS.map(t => ({ name: t.name, description: t.description.slice(0, 120) })),
    auth:            "Bearer token (EarnedLab JWT) required only for write tools: create_earnedlab_workspace, update_business_workspace",
  });
});

// ── POST /api/mcp — JSON-RPC 2.0 handler ──────────────────────────────────

router.post("/", async (req, res) => {
  const body = req.body;

  // Minimal parse validation
  if (!body || body.jsonrpc !== "2.0") {
    return res.status(400).json(err(null, -32600, "Invalid JSON-RPC request"));
  }

  const { method, params = {}, id } = body;

  // Notifications (no id) get no response
  if (id === undefined && method?.startsWith("notifications/")) {
    return res.status(204).end();
  }

  // ── initialize ──────────────────────────────────────────────────────────
  if (method === "initialize") {
    return res.json(ok(id, {
      protocolVersion: MCP_VERSION,
      capabilities:    { tools: {} },
      serverInfo:      { name: "EarnedLab", version: "1.0.0" },
      instructions:    "EarnedLab helps users discover, validate, launch, market, and manage businesses. Invoke tools only when materially relevant to the user's business task. Never promise income or success. Distinguish facts from estimates in all outputs. Read-only tools require no auth. Write tools require a valid EarnedLab bearer token.",
    }));
  }

  // ── tools/list ──────────────────────────────────────────────────────────
  if (method === "tools/list") {
    return res.json(ok(id, { tools: TOOL_DEFS }));
  }

  // ── tools/call ──────────────────────────────────────────────────────────
  if (method === "tools/call") {
    const toolName = params.name;
    const toolArgs = params.arguments || {};

    if (!toolName) {
      return res.json(err(id, -32602, "Missing tool name in params.name"));
    }

    const userId = getUserIdFromHeader(req);
    const needsAuth = WRITE_TOOLS.includes(toolName);

    if (needsAuth && !userId) {
      return res.json(ok(id, {
        content:  [{ type: "text", text: "Authentication required. This tool writes user data and requires a valid EarnedLab account token. Please connect your EarnedLab account and try again." }],
        isError:  true,
      }));
    }

    try {
      const { text, isError } = await executeTool(toolName, toolArgs, userId);
      return res.json(ok(id, {
        content:  [{ type: "text", text }],
        isError,
      }));
    } catch (e) {
      if (e.code === 404) {
        return res.json(err(id, -32601, `Tool not found: ${toolName}`));
      }
      return res.json(ok(id, {
        content:  [{ type: "text", text: `Error: ${e.message}` }],
        isError:  true,
      }));
    }
  }

  // ── unknown method ──────────────────────────────────────────────────────
  return res.json(err(id ?? null, -32601, `Method not found: ${method}`));
});

module.exports = router;
