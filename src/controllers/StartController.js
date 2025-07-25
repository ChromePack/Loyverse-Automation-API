const path = require('path');
const { Logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const WorkflowVisibleGoodsReport = require(path.join(__dirname, '../../workflow/workflow-visible-goods-report.js'));

// In-memory job store (for demo; use DB/Redis in production)
const jobs = {};

/**
 * StartController - Handles the /start automation endpoint
 */
class StartController {
  /**
   * Triggers the visible automation demo as a background job
   * POST /api/start
   */
  async startAutomation(req, res) {
    const requestId = req.requestId;
    Logger.info('Received /start automation request', { requestId });

    // 1. Generate a job ID and store initial status
    const jobId = uuidv4();
    jobs[jobId] = { status: 'pending', result: null, error: null, startedAt: new Date() };

    // 2. Run the automation in the background
    (async () => {
      const demo = new WorkflowVisibleGoodsReport();
      try {
        const result = await demo.run();
        jobs[jobId] = { ...jobs[jobId], status: 'completed', result, finishedAt: new Date() };
      } catch (error) {
        jobs[jobId] = { ...jobs[jobId], status: 'failed', error: error.message, finishedAt: new Date() };
      }
    })();

    // 3. Respond immediately with jobId
    res.status(202).json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Automation started. Check status with GET /api/start/' + jobId,
      metadata: {
        request_id: requestId,
        api_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get job status/result
   * GET /api/start/:jobId
   */
  getJobStatus(req, res) {
    const { jobId } = req.params;
    const job = jobs[jobId];
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found', timestamp: new Date().toISOString() }
      });
    }
    res.json({
      success: true,
      jobId,
      status: job.status,
      result: job.result,
      error: job.error,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt || null
    });
  }
}

module.exports = { StartController }; 