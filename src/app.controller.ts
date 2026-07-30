import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: Request, @Res() res: Response) {
    const data = this.appService.getHello();
    const acceptHeader = req.headers.accept ?? '';

    // If accessed via web browser, render a clean HTML view with formatted JSON & line breaks
    if (acceptHeader.includes('text/html')) {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Schedula API - Service Running Successfully</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 2rem;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 800px;
      width: 100%;
      background: #1e293b;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      border: 1px solid #334155;
    }
    .status-badge {
      display: inline-block;
      background: #059669;
      color: #ffffff;
      font-weight: 600;
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    h1 {
      color: #38bdf8;
      font-size: 1.75rem;
      margin-top: 0;
    }
    .message {
      background: #0f172a;
      border-left: 4px solid #10b981;
      padding: 1rem;
      border-radius: 4px;
      font-size: 1.1rem;
      color: #6ee7b7;
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.2rem;
      color: #fbbf24;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #334155;
      padding-bottom: 0.4rem;
    }
    ul {
      list-style-type: none;
      padding-left: 0;
      margin-top: 0.5rem;
    }
    li {
      background: #0f172a;
      padding: 0.6rem 1rem;
      margin-bottom: 0.5rem;
      border-radius: 6px;
      font-family: monospace;
      color: #e2e8f0;
      font-size: 0.95rem;
    }
    pre {
      background: #0f172a;
      padding: 1.2rem;
      border-radius: 8px;
      overflow-x: auto;
      color: #a5f3fc;
      font-size: 0.9rem;
      border: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="status-badge">ONLINE</span>
    <h1>Schedula API Status</h1>

    <div class="message">
      Service running successfully and all the end points are working successfully
    </div>

    <div class="section-title">🔐 Auth APIs</div>
    <ul>
      ${data.endpoints.auth_apis.map((e) => `<li>${e}</li>`).join('')}
    </ul>

    <div class="section-title">👨‍⚕️ Doctor APIs</div>
    <ul>
      ${data.endpoints.doctor_apis.map((e) => `<li>${e}</li>`).join('')}
    </ul>

    <div class="section-title">🧑‍🤝‍🧑 Patient APIs</div>
    <ul>
      ${data.endpoints.patient_apis.map((e) => `<li>${e}</li>`).join('')}
    </ul>

    <div class="section-title">📅 Appointment APIs</div>
    <ul>
      ${data.endpoints.appointment_apis.map((e) => `<li>${e}</li>`).join('')}
    </ul>

    <div class="section-title">📄 Raw JSON Output</div>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  </div>
</body>
</html>
      `;
      return res.type('html').send(htmlContent);
    }

    // Default: return raw JSON object
    return res.json(data);
  }
}
