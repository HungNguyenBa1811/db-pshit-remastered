export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const url = new URL(request.url);
    // Get the full path after /api/
    const fullPath = url.pathname;
    const targetUrl = `https://dbapi.ptit.edu.vn${fullPath}${url.search}`;

    console.log('Proxying to:', targetUrl);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Build headers for the proxied request
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
        if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
            headers.set(key, value);
        }
    }

    try {
        const fetchOptions = {
            method: request.method,
            headers: headers,
        };

        // Include body for non-GET/HEAD requests
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            fetchOptions.body = await request.text();
        }

        const response = await fetch(targetUrl, fetchOptions);

        // Build response headers
        const responseHeaders = new Headers();
        for (const [key, value] of response.headers.entries()) {
            if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        }
        responseHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
