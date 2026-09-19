import { EmailLog } from '../types';

export function createEmailAlert(
  to: string,
  subject: string,
  triggerEvent: string,
  details: {
    title: string;
    description: string;
    detailsList?: { label: string; value: string }[];
  }
): EmailLog {
  const timestamp = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const detailText = details.detailsList
    ? details.detailsList.map((d) => `• ${d.label}: ${d.value}`).join('\n')
    : '';

  const bodySnippet = `${details.title} - ${details.description} ${detailText ? `\n${detailText}` : ''}`;

  return {
    id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    to,
    subject,
    bodySnippet,
    timestamp,
    triggerEvent,
    status: 'delivered',
  };
}
