const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ''
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing messages' }) };
  }

  const requestBody = JSON.stringify({
    model: body.model || 'claude-sonnet-4-20250514',
    max_tokens: body.max_tokens || 1000,
    messages: body.messages
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          body: data
        });
      });
    });
    req.on('error', (e) => {
      resolve({ statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: e.message }) });
    });
    req.write(requestBody);
    req.end();
  });
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
