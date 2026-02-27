'use client';

import { useState } from 'react';
import './api-guide.css';

const BASE_URL = 'https://unpermitting-mirna-indefectibly.ngrok-free.dev';

const EXAMPLE_PAYLOAD = `{
  "top": "https://example.com/upper-occlusal.jpg",
  "center": "https://example.com/frontal-view.jpg",
  "left": "https://example.com/left-lateral.jpg",
  "right": "https://example.com/right-lateral.jpg",
  "bottom": "https://example.com/lower-occlusal.jpg",
  "pageSize": "a4-portrait"
}`;

const EXAMPLE_GDRIVE = `{
  "top": "https://drive.google.com/file/d/1ABcDeFgHiJkLmNoPqRsTuVwXyZ/view",
  "center": "https://drive.google.com/file/d/2ABcDeFgHiJkLmNoPqRsTuVwXyZ/view",
  "left": "https://drive.google.com/file/d/3ABcDeFgHiJkLmNoPqRsTuVwXyZ/view",
  "right": "https://drive.google.com/file/d/4ABcDeFgHiJkLmNoPqRsTuVwXyZ/view",
  "bottom": "https://drive.google.com/file/d/5ABcDeFgHiJkLmNoPqRsTuVwXyZ/view"
}`;

const CURL_EXAMPLE = `curl -X POST ${BASE_URL}/api/webhook \\
  -H "Content-Type: application/json" \\
  -o dental-review.pdf \\
  -d '{
    "top": "IMAGE_URL_OR_BASE64",
    "center": "IMAGE_URL_OR_BASE64",
    "left": "IMAGE_URL_OR_BASE64",
    "right": "IMAGE_URL_OR_BASE64",
    "bottom": "IMAGE_URL_OR_BASE64",
    "pageSize": "a4-portrait"
  }'`;

interface Endpoint {
    method: string;
    path: string;
    title: string;
    description: string;
    body?: string;
    params?: { name: string; type: string; desc: string }[];
    response: string;
}

const ENDPOINTS: Endpoint[] = [
    {
        method: 'POST',
        path: '/api/webhook',
        title: 'Compose Dental Review PDF (Make.com)',
        description: 'Main endpoint for Make.com integration. Accepts 5 dental image inputs, processes them with auto-crop/resize, composes cross layout, and returns a PDF file directly.',
        body: EXAMPLE_PAYLOAD,
        params: [
            { name: 'top', type: 'string', desc: 'Upper occlusal view — URL, Google Drive link, or Base64' },
            { name: 'center', type: 'string', desc: 'Frontal view — URL, Google Drive link, or Base64' },
            { name: 'left', type: 'string', desc: 'Left lateral view — URL, Google Drive link, or Base64' },
            { name: 'right', type: 'string', desc: 'Right lateral view — URL, Google Drive link, or Base64' },
            { name: 'bottom', type: 'string', desc: 'Lower occlusal view — URL, Google Drive link, or Base64' },
            { name: 'pageSize', type: 'string', desc: 'Optional: a4-portrait (default), a4-landscape, letter-portrait, letter-landscape' },
        ],
        response: `📄 PDF File (application/pdf)

Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="dental-review-xxx.pdf"

Body: Binary PDF data`,
    },
    {
        method: 'POST',
        path: '/api/webhook-face',
        title: 'Face Review PDF (3 Images)',
        description: 'Compose 3 face images (left profile, front, right profile) side by side into a single PDF page.',
        body: `{
  "left": "https://example.com/left-profile.jpg",
  "center": "https://example.com/front-face.jpg",
  "right": "https://example.com/right-profile.jpg",
  "pageSize": "a4-landscape"
}`,
        params: [
            { name: 'left', type: 'string', desc: 'Left profile photo — URL, Google Drive link, or Base64' },
            { name: 'center', type: 'string', desc: 'Front face photo — URL, Google Drive link, or Base64' },
            { name: 'right', type: 'string', desc: 'Right profile photo — URL, Google Drive link, or Base64' },
            { name: 'pageSize', type: 'string', desc: 'Optional: a4-landscape (default), a4-portrait, letter-portrait, letter-landscape' },
        ],
        response: `📄 PDF File (application/pdf)

Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="face-review-xxx.pdf"

Body: Binary PDF data`,
    },
    {
        method: 'POST',
        path: '/api/process-image',
        title: 'Process Single Image',
        description: 'Process a single dental image for a specific slot. Accepts file upload, URL, Google Drive link, or Base64.',
        params: [
            { name: 'file', type: 'File', desc: 'Image file (multipart/form-data)' },
            { name: 'url', type: 'string', desc: 'Image URL or Google Drive link' },
            { name: 'base64', type: 'string', desc: 'Base64 encoded image' },
            { name: 'slotType', type: 'string', desc: 'Slot type: top, center, left, right, or bottom' },
        ],
        response: `{
  "image": "data:image/jpeg;base64,..."
}`,
    },
    {
        method: 'GET',
        path: '/api/gdrive-proxy',
        title: 'Google Drive Image Proxy',
        description: 'Proxy for fetching images from Google Drive share links. Resolves share URLs to direct download.',
        params: [
            { name: 'url', type: 'string (query)', desc: 'Google Drive share URL' },
            { name: 'id', type: 'string (query)', desc: 'Google Drive file ID (alternative to url)' },
        ],
        response: 'Raw image binary (image/jpeg)',
    },
];

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-block">
            <div className="code-block__header">
                <span className="code-block__lang">{lang}</span>
                <button className="code-block__copy" onClick={copy}>
                    {copied ? '✅ Copied' : '📋 Copy'}
                </button>
            </div>
            <pre><code>{code}</code></pre>
        </div>
    );
}

function MethodBadge({ method }: { method: string }) {
    const colors: Record<string, string> = {
        GET: '#34d399',
        POST: '#4a6cf7',
        PUT: '#f59e0b',
        DELETE: '#f87171',
    };
    return (
        <span className="method-badge" style={{ background: colors[method] || '#888' }}>
            {method}
        </span>
    );
}

export default function ApiGuidePage() {
    return (
        <main className="api-guide">
            <header className="api-guide__header">
                <a href="/" className="api-guide__back">← Back to Composer</a>
                <div className="api-guide__title-row">
                    <div className="api-guide__icon">🦷</div>
                    <div>
                        <h1>Dental Review Composer — API Guide</h1>
                        <p className="api-guide__subtitle">Integration documentation for Make.com and external services</p>
                    </div>
                </div>
            </header>

            <section className="api-guide__section">
                <h2>🔗 Base URL</h2>
                <CodeBlock code={BASE_URL} lang="url" />
            </section>

            <section className="api-guide__section">
                <h2>📐 Image Layout</h2>
                <div className="layout-diagram">
                    <pre>{`
        ┌──────────────┐
        │     TOP      │  Upper Occlusal (16:10)
        └──────────────┘
  ┌──────────┬──────────────┬──────────┐
  │   LEFT   │    CENTER    │  RIGHT   │  Lateral + Frontal
  │  (10:14) │    (4:3)     │  (10:14) │
  └──────────┴──────────────┴──────────┘
        ┌──────────────┐
        │    BOTTOM    │  Lower Occlusal (16:10)
        └──────────────┘`}</pre>
                </div>
            </section>

            <section className="api-guide__section">
                <h2>🔌 Supported Input Types</h2>
                <table className="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span className="tag tag--blue">Direct URL</span></td>
                            <td><code>https://example.com/photo.jpg</code></td>
                        </tr>
                        <tr>
                            <td><span className="tag tag--green">Google Drive</span></td>
                            <td><code>https://drive.google.com/file/d/xxxxx/view</code></td>
                        </tr>
                        <tr>
                            <td><span className="tag tag--amber">Base64</span></td>
                            <td><code>data:image/jpeg;base64,/9j/4AAQ...</code></td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {ENDPOINTS.map((ep, i) => (
                <section key={i} className="api-guide__section api-endpoint">
                    <div className="api-endpoint__header">
                        <MethodBadge method={ep.method} />
                        <code className="api-endpoint__path">{ep.path}</code>
                    </div>
                    <h3>{ep.title}</h3>
                    <p className="api-endpoint__desc">{ep.description}</p>

                    {ep.params && (
                        <div className="api-endpoint__params">
                            <h4>Parameters</h4>
                            <table className="api-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ep.params.map((p, j) => (
                                        <tr key={j}>
                                            <td><code>{p.name}</code></td>
                                            <td><span className="tag tag--dim">{p.type}</span></td>
                                            <td>{p.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {ep.body && (
                        <div className="api-endpoint__body">
                            <h4>Request Body</h4>
                            <CodeBlock code={ep.body} />
                        </div>
                    )}

                    <div className="api-endpoint__response">
                        <h4>Response</h4>
                        <CodeBlock code={ep.response} />
                    </div>
                </section>
            ))}

            <section className="api-guide__section">
                <h2>⚡ Quick Test (cURL)</h2>
                <CodeBlock code={CURL_EXAMPLE} lang="bash" />
            </section>

            <section className="api-guide__section">
                <h2>🔧 Make.com Setup</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step__num">1</div>
                        <div className="step__content">
                            <h4>Create a new Scenario</h4>
                            <p>Add a trigger module (e.g. Google Forms, Webhook, Schedule)</p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step__num">2</div>
                        <div className="step__content">
                            <h4>Add &quot;HTTP - Make a Request&quot; module</h4>
                            <p>Method: <strong>POST</strong></p>
                            <p>URL: <code>{BASE_URL}/api/webhook</code></p>
                            <p>Headers: <code>Content-Type: application/json</code></p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step__num">3</div>
                        <div className="step__content">
                            <h4>Set Body (JSON)</h4>
                            <p>Map your 5 image URLs/links to the slot keys: <code>top</code>, <code>center</code>, <code>left</code>, <code>right</code>, <code>bottom</code></p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step__num">4</div>
                        <div className="step__content">
                            <h4>Handle Response</h4>
                            <p>The response is a <strong>PDF file</strong> directly. In Make.com, set &quot;Parse response&quot; to <strong>No</strong> to receive the raw binary. Save it to Google Drive, attach to email, or send to client.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="api-guide__section">
                <h2>🏥 Google Drive Example</h2>
                <CodeBlock code={EXAMPLE_GDRIVE} />
            </section>

            <footer className="api-guide__footer">
                <p>Dental Review Composer API v1.0 • <a href="/">Open Composer UI</a></p>
            </footer>
        </main>
    );
}
