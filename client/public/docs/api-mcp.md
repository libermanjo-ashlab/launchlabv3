# API and MCP

EarnedLab's remote MCP server lets AI assistants (Claude, ChatGPT, and any MCP-compatible client) use EarnedLab's business tools directly — without the user opening the EarnedLab app.

---

## MCP server

**Endpoint:** `https://earnedlab.com/api/mcp`
**Protocol:** Model Context Protocol (MCP) 2024-11-05, JSON-RPC 2.0 over HTTP
**Methods supported:** `initialize`, `tools/list`, `tools/call`

### Connecting from Claude

In Claude.ai settings, go to Connectors → Add connector → enter `https://earnedlab.com/api/mcp`.

Read-only tools are available immediately. Write tools require you to connect your EarnedLab account (Bearer token authentication).

### Connecting from other MCP clients

Any MCP-compatible client can connect by pointing to `https://earnedlab.com/api/mcp` and sending JSON-RPC 2.0 requests.

---

## Available tools

### Read-only (no authentication required)

All 7 read-only tools are accessible without an account. They use Claude to generate structured, grounded business analysis.

| Tool | Description |
|------|-------------|
| `discover_business_opportunities` | Generate a ranked shortlist of business directions based on skills, budget, time, goals, and constraints |
| `validate_business_idea` | Structured validation report: customer problem, market demand, competitors, differentiation, risks, experiments |
| `analyze_market` | Market and competitor analysis with explicit labeling of facts, estimates, and assumptions |
| `create_business_launch_plan` | Staged launch plan with milestones, task list, budget breakdown, and decision checkpoints |
| `create_marketing_strategy` | Positioning, message hierarchy, channel prioritization, campaign plan, and metrics |
| `create_content_plan` | Content pillars, monthly calendar, post briefs, repurposing plan, and voice guidance |
| `audit_business_operations` | Operations map, bottleneck identification, automation opportunities, and priority actions |

### Write (requires EarnedLab account)

| Tool | Description |
|------|-------------|
| `create_earnedlab_workspace` | Create an EarnedLab business workspace from approved context |
| `update_business_workspace` | Save approved plans, tasks, or content to an existing workspace |

Write tools require a Bearer token: your EarnedLab JWT, obtained from the app.

---

## Quick start

### List available tools

```http
POST https://earnedlab.com/api/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}
```

### Discover business opportunities

```http
POST https://earnedlab.com/api/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "discover_business_opportunities",
    "arguments": {
      "skills": "marketing, copywriting, project management",
      "hours_per_week": "10",
      "budget": "$500",
      "income_goal": "$2,000/month in 6 months",
      "risk_tolerance": "moderate"
    }
  },
  "id": 2
}
```

### Create a workspace (authenticated)

```http
POST https://earnedlab.com/api/mcp
Content-Type: application/json
Authorization: Bearer <your-earnedlab-token>

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_earnedlab_workspace",
    "arguments": {
      "workspace_name": "My Consulting Practice",
      "approved_business_context": {
        "description": "Independent marketing consultant for B2B SaaS companies",
        "offer": "90-day content strategy engagement",
        "target_customer": "Series A SaaS founders",
        "location": "Remote",
        "budget": "1000",
        "hours_per_week": "15"
      },
      "selected_plan": {
        "phase1": "Define offer and launch website",
        "phase2": "Activate referral network and LinkedIn outreach"
      }
    }
  },
  "id": 3
}
```

---

## OpenAPI spec

The MCP endpoint is also described in an OpenAPI 3.1 spec for GPT Actions integration:

`https://earnedlab.com/openapi.json`

---

## Agent guidance files

For AI agent frameworks that use skill or agent files:

- **AGENTS.md:** `https://earnedlab.com/AGENTS.md`
- **Start business skill:** `https://earnedlab.com/agents/start-business.md`
- **Validate business skill:** `https://earnedlab.com/agents/validate-business.md`
- **Market business skill:** `https://earnedlab.com/agents/market-business.md`
- **Manage business skill:** `https://earnedlab.com/agents/manage-business.md`

---

## Rate limits and token budget

The MCP server is rate-limited to 30 requests per minute per IP. Read-only tools make Claude API calls server-side — responses typically take 10–30 seconds for complex analyses.

Write tools write to the EarnedLab database. They require an authenticated EarnedLab account and count against the account's daily token budget.

---

## Safety

- Read-only tools never store user inputs or share data between users.
- Write tools only modify data belonging to the authenticated user.
- All tools follow the [Responsible AI](https://earnedlab.com/responsible-ai) guidelines: no income promises, explicit labeling of estimates, no regulated professional advice.

---

## Related docs

- [Getting started](https://earnedlab.com/docs/getting-started.md)
- [Plans and daily limits](https://earnedlab.com/docs/plans-and-limits.md)
- [Responsible AI](https://earnedlab.com/responsible-ai)
- [EarnedLab product guide](https://earnedlab.com/llms-full.txt)
