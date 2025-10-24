import cron from 'node-cron';
import { query } from '../database/connection';
import { decrypt } from '../utils/encryption';
import { getClient } from './apiClients';

interface ApiKeyRecord {
  id: number;
  encrypted_key: string;
  provider: 'openai' | 'anthropic';
}

export class PollingService {
  private cronJob: cron.ScheduledTask | null = null;

  start(intervalMinutes: number = 5) {
    // Run every N minutes
    const cronExpression = `*/${intervalMinutes} * * * *`;

    console.log(`Starting polling service with interval: ${intervalMinutes} minutes`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.pollAllKeys();
    });

    // Run immediately on start
    this.pollAllKeys();
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Polling service stopped');
    }
  }

  async pollAllKeys() {
    try {
      console.log('Starting polling cycle...');

      const keys = await query<ApiKeyRecord[]>(
        'SELECT id, encrypted_key, provider FROM api_keys WHERE is_active = true'
      );

      console.log(`Found ${keys.length} active keys to poll`);

      for (const key of keys) {
        await this.pollKey(key);
      }

      console.log('Polling cycle completed');
    } catch (error) {
      console.error('Error in polling cycle:', error);
    }
  }

  private async pollKey(keyRecord: ApiKeyRecord) {
    try {
      const apiKey = decrypt(keyRecord.encrypted_key);
      const client = getClient(keyRecord.provider);

      // Fetch usage for today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const usageData = await client.fetchUsage(apiKey, startOfDay, endOfDay);

      // Store snapshot
      await query(
        `INSERT INTO usage_snapshots (api_key_id, snapshot_date, total_cost, token_usage, request_count, model_breakdown)
        VALUES (?, CURDATE(), ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_cost = VALUES(total_cost),
          token_usage = VALUES(token_usage),
          request_count = VALUES(request_count),
          model_breakdown = VALUES(model_breakdown)`,
        [
          keyRecord.id,
          usageData.totalCost,
          usageData.tokenUsage,
          usageData.requestCount,
          JSON.stringify(usageData.modelBreakdown),
        ]
      );

      // Log polling history
      await query(
        `INSERT INTO polling_history (api_key_id, status, response_data)
        VALUES (?, 'success', ?)`,
        [keyRecord.id, JSON.stringify(usageData)]
      );

      console.log(`✓ Polled key ${keyRecord.id} (${keyRecord.provider})`);

      // Check for spending alerts
      await this.checkSpendingAlerts(keyRecord.id);

    } catch (error: any) {
      console.error(`✗ Error polling key ${keyRecord.id}:`, error.message);

      // Log failure
      await query(
        `INSERT INTO polling_history (api_key_id, status, error_message)
        VALUES (?, 'failure', ?)`,
        [keyRecord.id, error.message]
      );
    }
  }

  private async checkSpendingAlerts(keyId: number) {
    try {
      const alerts = await query<any[]>(
        `SELECT id, threshold_amount, threshold_type, alert_email, last_triggered_at
        FROM spending_alerts
        WHERE api_key_id = ? AND is_enabled = true`,
        [keyId]
      );

      for (const alert of alerts) {
        let actualSpend = 0;

        if (alert.threshold_type === 'daily') {
          const result = await query<any[]>(
            `SELECT COALESCE(total_cost, 0) as spend
            FROM usage_snapshots
            WHERE api_key_id = ? AND snapshot_date = CURDATE()`,
            [keyId]
          );
          actualSpend = result[0]?.spend || 0;
        } else if (alert.threshold_type === 'monthly') {
          const result = await query<any[]>(
            `SELECT COALESCE(SUM(total_cost), 0) as spend
            FROM usage_snapshots
            WHERE api_key_id = ? AND snapshot_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
            [keyId]
          );
          actualSpend = result[0]?.spend || 0;
        }

        if (actualSpend >= alert.threshold_amount) {
          // Check if we haven't triggered this alert recently (within last hour)
          const lastTriggered = alert.last_triggered_at ? new Date(alert.last_triggered_at) : null;
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

          if (!lastTriggered || lastTriggered < oneHourAgo) {
            console.log(`⚠️  Spending alert triggered for key ${keyId}: $${actualSpend} >= $${alert.threshold_amount}`);

            // Update last triggered time
            await query(
              `UPDATE spending_alerts SET last_triggered_at = NOW() WHERE id = ?`,
              [alert.id]
            );

            // In a real implementation, send email notification here
            // sendEmailAlert(alert.alert_email, keyId, actualSpend, alert.threshold_amount);
          }
        }
      }
    } catch (error) {
      console.error('Error checking spending alerts:', error);
    }
  }
}

export const pollingService = new PollingService();
