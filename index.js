require('dotenv').config();
const { Composio } = require('@composio/core');
const Anthropic = require('@anthropic-ai/sdk');

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
    // Verbundene Apps und verfügbare Tools laden
    const tools = await composio.tools.get({}, { limit: 10 });
    console.log('Verfügbare Tools:', tools.map(t => t.name));

    // Beispiel: Mit Claude und Composio-Tools chatten
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        tools: tools,
        messages: [
            { role: 'user', content: 'Was kannst du mit den verfügbaren Tools machen?' }
        ]
    });

    console.log('Antwort:', response.content);
}

main().catch(console.error);
