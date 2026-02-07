import { Endpoint, Check } from '@prisma/client';
import { request } from 'undici';
import { logger } from '../logger.js';

export async function sendTeamsAlert(
  webhookUrl: string,
  endpoint: Endpoint,
  check: Check,
  retryCount = 3
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
              text: `🚨 Endpoint Alert: ${endpoint.name}`,
              weight: 'bolder',
              size: 'large',
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'URL', value: endpoint.url },
                { title: 'Status', value: check.statusCode?.toString() ?? 'N/A' },
                { title: 'Latency', value: `${check.responseTimeMs}ms` },
                { title: 'Error', value: check.error ?? 'None' },
              ],
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
