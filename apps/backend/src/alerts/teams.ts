import { Endpoint, Check } from '@prisma/client';
import { request } from 'undici';
import { logger } from '../logger.js';
import { type AlertType, formatDuration } from '../services/alert.service.js';

function buildCardHeader(alertType: AlertType, name: string, durationMs: number): string {
  const duration = formatDuration(durationMs);
  switch (alertType) {
    case 'down':
      return `🚨 Endpoint DOWN: ${name}`;
    case 'reminder':
      return `⏳ Still DOWN: ${name} (${duration})`;
    case 'recovery':
      return `✅ Recovered: ${name} (after ${duration})`;
  }
}

function buildFacts(
  endpoint: Endpoint,
  check: Check,
  alertType: AlertType,
  durationMs: number
): { title: string; value: string }[] {
  const facts: { title: string; value: string }[] = [
    { title: 'URL', value: endpoint.url },
    { title: 'Status', value: check.statusCode?.toString() ?? 'N/A' },
    { title: 'Latency', value: `${check.responseTimeMs}ms` },
  ];

  if (alertType !== 'recovery') {
    facts.push({ title: 'Error', value: check.error ?? 'None' });
  }

  if (alertType === 'reminder' || alertType === 'recovery') {
    facts.push({ title: 'Duration', value: formatDuration(durationMs) });
  }

  return facts;
}

export async function sendTeamsAlert(
  webhookUrl: string,
  endpoint: Endpoint,
  check: Check,
  retryCount = 3,
  alertType: AlertType = 'down',
  durationMs = 0
): Promise<boolean> {
  const payload = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: buildCardHeader(alertType, endpoint.name, durationMs),
              weight: 'bolder',
              size: 'large',
            },
            {
              type: 'FactSet',
              facts: buildFacts(endpoint, check, alertType, durationMs),
            },
          ],
        },
      },
    ],
  };

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      const response = await request(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (response.statusCode === 200) return true;
    } catch (error) {
      logger.warn(
        { attempt, err: error, endpointId: endpoint.id },
        'Teams alert failed'
      );
      if (attempt === retryCount) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
}
