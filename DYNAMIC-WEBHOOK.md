# Dynamic Webhook Integration

The Loyverse Automation API now supports dynamic webhook URLs, allowing you to specify custom webhook endpoints when starting automation jobs.

## Usage

### POST /api/start with Custom Webhook

You can now include a `webhookUrl` parameter in your request body to specify where the automation results should be sent.

#### Request Example

```bash
curl -X POST http://localhost:3000/api/start \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://n8n.srv955713.hstgr.cloud/webhook/eb25f31a-326c-4434-a327-eadd26183b51"
  }'
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `webhookUrl` | string | Optional | Custom webhook URL to receive automation results. If not provided, the default webhook will be used. |

#### Response Example

```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "message": "Automation started. Check status with GET /api/start/550e8400-e29b-41d4-a716-446655440000",
  "webhookUrl": "https://n8n.srv955713.hstgr.cloud/webhook/eb25f31a-326c-4434-a327-eadd26183b51",
  "metadata": {
    "request_id": "req_1234567890_abcdef",
    "api_version": "1.0.0",
    "timestamp": "2025-01-20T10:30:00.000Z"
  }
}
```

### Webhook Payload

When the automation job completes (successfully or with an error), a POST request will be sent to the specified webhook URL with the following payload:

```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    // Automation results data here
    "stores": [...],
    "totalSales": 1234.56,
    "itemsProcessed": 42
  },
  "error": null,
  "startedAt": "2025-01-20T10:30:00.000Z",
  "finishedAt": "2025-01-20T10:35:45.000Z"
}
```

#### Webhook Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the automation completed successfully |
| `jobId` | string | Unique identifier for the automation job |
| `status` | string | Job status: `completed`, `failed`, or `cancelled` |
| `result` | object | The automation results data (null if failed) |
| `error` | string | Error message if the job failed (null if successful) |
| `startedAt` | string | ISO timestamp when the job started |
| `finishedAt` | string | ISO timestamp when the job completed |

### Error Handling

#### Invalid Webhook URL

If you provide an invalid webhook URL, you'll receive an error response:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_WEBHOOK_URL",
    "message": "Invalid webhook URL provided",
    "details": ["Webhook URL is invalid"],
    "timestamp": "2025-01-20T10:30:00.000Z"
  },
  "metadata": {
    "request_id": "req_1234567890_abcdef",
    "api_version": "1.0.0"
  }
}
```

#### Webhook Delivery Retry Logic

The system implements retry logic for webhook delivery:

- **Maximum Retries**: 3 attempts (configurable)
- **Timeout**: 10 seconds per attempt (configurable)
- **Retry Delay**: 2 seconds between attempts (configurable)
- **Backoff**: Fixed delay between retries

### Job Status

You can check the status of any job using:

```bash
curl http://localhost:3000/api/start/{jobId}
```

#### Status Response Example

```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    // Results data
  },
  "error": null,
  "startedAt": "2025-01-20T10:30:00.000Z",
  "finishedAt": "2025-01-20T10:35:45.000Z",
  "webhookUrl": "https://n8n.srv955713.hstgr.cloud/webhook/eb25f31a-326c-4434-a327-eadd26183b51"
}
```

### Examples

#### Example 1: Using Custom Webhook for n8n Integration

```bash
curl -X POST http://localhost:3000/api/start \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://n8n.srv955713.hstgr.cloud/webhook/eb25f31a-326c-4434-a327-eadd26183b51"
  }'
```

#### Example 2: Using Default Webhook

```bash
curl -X POST http://localhost:3000/api/start
```

This will use the default webhook URL configured in the system.

#### Example 3: Without Webhook (Processing Only)

If webhooks are disabled in the configuration and no custom URL is provided, the automation will run but no webhook will be sent.

## Configuration

The webhook behavior can be configured through environment variables:

- `WEBHOOK_ENABLED`: Enable/disable default webhook (default: true)
- `WEBHOOK_TIMEOUT`: Timeout for webhook requests in ms (default: 10000)
- `WEBHOOK_MAX_RETRIES`: Maximum retry attempts (default: 3)
- `WEBHOOK_RETRY_DELAY`: Delay between retries in ms (default: 2000)

## Security Considerations

- All webhook URLs are validated before use
- The system will only send HTTP POST requests to HTTPS endpoints
- Request payloads include timestamps and job IDs for tracking
- Failed webhook deliveries are logged with detailed error information

## Browser Testing

For testing purposes, you can use tools like:
- **Webhook.site**: Generate temporary webhook URLs for testing
- **ngrok**: Expose local endpoints to the internet
- **Postman**: Mock webhook servers