# API and MCP (Coming Soon)

EarnedLab is building programmatic access and a remote Model Context Protocol (MCP) server. These capabilities are planned for Tier 3 of the platform's AI visibility roadmap.

---

## REST API (planned)

A REST API will allow developers and power users to:

- Trigger agent runs programmatically (marketing analysis, management tasks, content generation)
- Read business data, plans, tasks, and agent outputs
- Create and update business profile information
- Monitor agent activity and retrieve logs

The API will use token-based authentication. Endpoints will follow the same authorization model as the web app — actions are scoped to your account and businesses.

**Status:** Not yet available. Expected availability: announced via the EarnedLab changelog when ready.

---

## MCP Server (planned)

EarnedLab is building a remote Model Context Protocol server that will allow AI assistants (Claude, ChatGPT, and others that support MCP) to use EarnedLab tools directly from within a conversation.

### Planned tools

The MCP server is planned to expose the following tools:

| Tool | Description |
|------|-------------|
| `get_business_profile` | Retrieve the full business profile, goals, and market context |
| `get_plan` | Retrieve the current business plan and milestone status |
| `run_marketing_analysis` | Trigger a marketing agent analysis and return results |
| `get_marketing_history` | Retrieve past marketing analyses and recommendations |
| `create_task` | Add a task to the business hub |
| `get_tasks` | Retrieve current task list with status |
| `generate_content` | Generate content lab output for a specified channel and topic |
| `get_revenue_data` | Retrieve revenue and lead tracking entries |
| `run_management_task` | Queue a management agent task for approval or execution |

### How it will work

1. Connect the EarnedLab MCP server to your Claude or ChatGPT workspace.
2. Ask your AI assistant to "check my EarnedLab marketing analysis" or "generate a LinkedIn post for my freelance design business."
3. The AI assistant calls the relevant EarnedLab tool and returns the results in context.

This enables EarnedLab data and agent capabilities to be used from within any AI assistant that supports MCP — without needing to open the EarnedLab app.

**Status:** Not yet available. The MCP server is planned for submission to Anthropic's MCP connector directory and ChatGPT's plugin directory.

---

## Staying informed

When API and MCP access becomes available, it will be announced via:

- The EarnedLab changelog (in-app)
- Email notification to subscribers who have opted into product updates

---

## Related docs

- [Getting started](https://earnedlab.com/docs/getting-started.md)
- [Marketing agent](https://earnedlab.com/docs/marketing-agent.md)
- [Management agent](https://earnedlab.com/docs/management-agent.md)
- [EarnedLab product guide](https://earnedlab.com/llms-full.txt)
