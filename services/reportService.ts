import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WorkoutSession, StrengthMetricPayload, CardioMetricPayload } from '../types/database.types';

/**
 * Extracts a concise human-readable key metric summary from a session's activities and metrics
 */
function extractSessionMetrics(session: WorkoutSession): string {
  if (session.type === 'cardio') {
    let distanceKm: number | null = null;
    let pace: number | null = null;
    let timeSec: number | null = null;

    if (session.activities) {
      for (const act of session.activities) {
        if (act.metrics) {
          for (const m of act.metrics) {
            const p = m.payload as Partial<CardioMetricPayload>;
            if (p) {
              if (p.distance_km != null) distanceKm = p.distance_km;
              if (p.pace_min_km != null) pace = p.pace_min_km;
              if (p.time_seconds != null) timeSec = p.time_seconds;
            }
          }
        }
      }
    }

    const parts: string[] = [];
    if (distanceKm != null && distanceKm > 0) {
      parts.push(`${distanceKm.toFixed(2)} km`);
    }
    if (pace != null && pace > 0) {
      const mins = Math.floor(pace);
      const secs = Math.round((pace - mins) * 60);
      parts.push(`Pace: ${mins}'${secs.toString().padStart(2, '0')}"/km`);
    } else if (timeSec != null && timeSec > 0 && distanceKm != null && distanceKm > 0) {
      const calculatedPace = timeSec / 60 / distanceKm;
      const mins = Math.floor(calculatedPace);
      const secs = Math.round((calculatedPace - mins) * 60);
      parts.push(`Pace: ${mins}'${secs.toString().padStart(2, '0')}"/km`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Cardio Workout';
  }

  // Strength or Hybrid
  let totalVolume = 0;
  let totalSets = 0;
  const exerciseNames: string[] = [];

  if (session.activities) {
    for (const act of session.activities) {
      exerciseNames.push(act.name);
      if (act.metrics) {
        for (const m of act.metrics) {
          totalSets++;
          const p = m.payload as Partial<StrengthMetricPayload>;
          if (p && p.reps != null && p.weight_kg != null) {
            totalVolume += (Number(p.reps) || 0) * (Number(p.weight_kg) || 0);
          }
        }
      }
    }
  }

  const parts: string[] = [];
  if (totalVolume > 0) {
    parts.push(`Volume: ${Math.round(totalVolume).toLocaleString()} kg`);
  }
  if (totalSets > 0) {
    parts.push(`${totalSets} sets`);
  }
  if (exerciseNames.length > 0 && parts.length === 0) {
    parts.push(exerciseNames.slice(0, 3).join(', '));
  }

  return parts.length > 0 ? parts.join(' • ') : 'Completed Session';
}

/**
 * Builds a modern HTML report, converts to PDF via Expo Print,
 * and launches the native share sheet.
 */
export async function generateAndShareReport(
  userName: string,
  recentSessions: WorkoutSession[],
  aiSummary: string
): Promise<string> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const tableRows = recentSessions.length > 0
    ? recentSessions
        .map((session, index) => {
          const dateStr = session.date
            ? new Date(session.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : '--';
          const typeStr = (session.type || 'Workout').toUpperCase();
          const durationStr = session.duration_min ? `${session.duration_min} min` : '--';
          const metricsStr = extractSessionMetrics(session);
          const titleStr = session.title || 'Training Session';
          const isEven = index % 2 === 0;

          return `
            <tr style="background-color: ${isEven ? '#FFFFFF' : '#F8FAFC'};">
              <td style="padding: 12px 14px; font-weight: 600; color: #1E293B; border-bottom: 1px solid #E2E8F0;">
                ${dateStr}
              </td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0;">
                <span style="font-weight: 700; color: #0F172A; display: block; font-size: 13px;">${titleStr}</span>
                <span style="display: inline-block; background-color: #EEF2FF; color: #4F46E5; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 3px;">
                  ${typeStr}
                </span>
              </td>
              <td style="padding: 12px 14px; color: #475569; font-size: 13px; border-bottom: 1px solid #E2E8F0;">
                ${durationStr}
              </td>
              <td style="padding: 12px 14px; color: #0F172A; font-weight: 600; font-size: 13px; border-bottom: 1px solid #E2E8F0;">
                ${metricsStr}
              </td>
            </tr>
          `;
        })
        .join('')
    : `
      <tr>
        <td colspan="4" style="padding: 24px; text-align: center; color: #64748B; font-style: italic;">
          No workouts logged in the recent period.
        </td>
      </tr>
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Coach Report - ${userName}</title>
      <style>
        body {
          font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          margin: 0;
          padding: 32px;
          color: #0F172A;
          background-color: #FFFFFF;
          -webkit-font-smoothing: antialiased;
        }
        .header {
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 20px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .brand {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #4F46E5;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .title {
          font-size: 26px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }
        .meta {
          text-align: right;
          font-size: 12px;
          color: #64748B;
        }
        .meta strong {
          color: #1E293B;
        }
        .summary-card {
          background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
          border-left: 4px solid #4F46E5;
          border-radius: 8px;
          padding: 18px 20px;
          margin-bottom: 32px;
        }
        .summary-label {
          font-size: 11px;
          font-weight: 800;
          color: #4F46E5;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .summary-text {
          font-size: 14px;
          line-height: 1.6;
          color: #334155;
          margin: 0;
          font-weight: 500;
        }
        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 36px;
        }
        th {
          background-color: #0F172A;
          color: #F8FAFC;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 12px 14px;
          text-align: left;
        }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
          font-size: 11px;
          color: #94A3B8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">OmniFit Intelligence • AI Coach Report</div>
          <h1 class="title">Performance Audit</h1>
        </div>
        <div class="meta">
          <div>Athlete: <strong>${userName}</strong></div>
          <div>Generated: <strong>${currentDate}</strong></div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Executive AI Summary</div>
        <p class="summary-text">${aiSummary || 'Consistent training session progression observed over the recent recording cycle. Key metabolic and hypertrophy targets remain on track.'}</p>
      </div>

      <div class="section-title">Recent Training Sessions</div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Date</th>
            <th style="width: 35%;">Session</th>
            <th style="width: 18%;">Duration</th>
            <th style="width: 32%;">Key Metrics</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        Generated by OmniFit AI Sports Intelligence Engine • Confidential Athlete Training Report
      </div>
    </body>
    </html>
  `;

  // 1. Convert HTML string to PDF file
  const file = await Print.printToFileAsync({
    html: htmlContent,
  });

  // 2. Share via native share sheet
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Coach Report - ${userName}`,
    });
  }

  return file.uri;
}
