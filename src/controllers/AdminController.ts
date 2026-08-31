import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { ArtistProfileService } from '../services/ArtistProfileService';
import { handleError } from '../utils/helpers';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../errors/AppError';
import { routeParam } from '../utils/routeParams';
import { VerificationStatus } from '../entities/ArtistVerification';
import { TransactionLogService } from '../services/TransactionLogService';

/**
 * Admin-facing user & role management (Issue #100) and artist verification
 * review (Issue #92).
 */
export class AdminController {
  private static userService = new UserService();
  private static artistProfileService = new ArtistProfileService();
  private static transactionLogService = new TransactionLogService();
export class AdminController {
  private static userService = new UserService();
  private static artistProfileService = new ArtistProfileService();
  private static transactionLogService = new TransactionLogService();
  private static reportService = new ReportService();
  private static commentReportService = new CommentReportService();
  private static indexerService = new (require('../services/IndexerService').IndexerService)();

  /**
   * GET /api/admin/reports — list the pending content-report moderation queue
   * (song and comment reports, Issue #88 / #411).
   */
  static listReports = async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const songId = typeof req.query.songId === 'string' ? req.query.songId : undefined;

      const songReports = await AdminController.reportService.listPendingReports(
        page,
        limit,
        songId,
      );
      const commentReports = await AdminController.commentReportService.listPendingReports(
        page,
        limit,
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        songReports,
        commentReports,
      });
    } catch (error) {
      handleError(req, res, error);
    }
  };

  /**
   * PUT /api/admin/reports/:id/resolve — resolve a song content report
   * (Issue #88).
   */
  static resolveReport = async (req: Request, res: Response) => {
    try {
      const moderatorId = (req as any).user?.id;

      if (!moderatorId) {
        return handleError(req, res, AppError.authentication('Moderator not authenticated'));
      }

      const report = await AdminController.reportService.resolveReport(
        routeParam(req.params.id),
        moderatorId,
        req.body as ResolveReportDTO,
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Report resolved',
        report,
      });
    } catch (error) {
      handleError(req, res, error);
    }
  };

  /**
   * GET /api/admin/comment-reports — list pending comment reports with comment
   * context (Issue #411).
   */
  static listCommentReports = async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await AdminController.commentReportService.listPendingReports(page, limit);
      return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (error) {
      handleError(req, res, error);
    }
  };

  /**
   * PUT /api/admin/comment-reports/:id/resolve — resolve a comment report and
   * flag the comment (Issue #411).
   */
  static resolveCommentReport = async (req: Request, res: Response) => {
    try {
      const moderatorId = (req as any).user?.id;

      if (!moderatorId) {
        return handleError(req, res, AppError.authentication('Moderator not authenticated'));
      }

      const report = await AdminController.commentReportService.resolveReport(
        routeParam(req.params.id),
        moderatorId,
        req.body as ResolveCommentReportDTO,
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Comment report resolved',
        report,
      });
    } catch (error) {
      handleError(req, res, error);
    }
  };us(HTTP_STATUS.OK).json({
        success: true,
        message: 'Verification rejected',
        verification,
      });
    } catch (error) {
      handleError(req, res, error);
    }
  };

  /**
   * GET /api/admin/transaction-logs — list transaction logs (Issue #39).
   */
  static getTransactionLogs = async (req: Request, res: Response) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50,
      };

      const result = await AdminController.transactionLogService.getAdminLogs(filters);

      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      handleError(req, res, error);
    }
  };

  /**
   * GET /api/admin/indexer/status — get indexer health per contract/network (Issue #253).
   *
   * Returns cursor position, lag, event count, and last error for all contracts.
   * Admin-gated via requirePermission middleware.
   */
  static getIndexerStatus = async (req: Request, res: Response) => {
    try {
      const currentLedgerParam = req.query.currentLedger as string | undefined;
      const currentLedger = currentLedgerParam ? Number(currentLedgerParam) : undefined;

      const statuses = await AdminController.indexerService.getAllStatus(currentLedger);
      const backfillStatuses = await AdminController.indexerService.getAllBackfillStatus();

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        indexers: statuses,
        backfills: backfillStatuses,
      });
    } catch (error) {
      handleError(req, res, error);
    }
  };
}
