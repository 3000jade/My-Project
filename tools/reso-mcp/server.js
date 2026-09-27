import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const server = new Server(
  { name: 'reso-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'query_reso_properties',
      description: 'Executes an OData v4 query against the RESO /Property resource endpoint.',
      inputSchema: {
        type: 'object',
        properties: {
          odataFilter: {
            type: 'string',
            description: "OData $filter expression, e.g., \"City eq 'Seattle' and ListPrice le 800000 and StandardStatus eq 'Active'\""
          },
          limit: { type: 'number', description: 'Maximum records to fetch (max 25, default 10)' }
        },
        required: ['odataFilter']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'query_reso_properties') {
    const { odataFilter, limit = 10 } = request.params.arguments || {};
    
    // In production, execute against ResoClient or mock data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            appliedFilter: odataFilter,
            count: 0,
            properties: []
          }, null, 2)
        }
      ]
    };
  }
  throw new Error(`Tool ${request.params.name} not found`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
