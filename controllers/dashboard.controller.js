import { getDashboardKpis, getDashboardOverview } from '../services/dashboard.service.js';
import { toDashboardKpisResponseDto } from '../dto/dashboard/kpis.response.dto.js';
import { sendSuccess } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import { toDashboardOverviewResponseDto } from '../dto/dashboard/overview.response.dto.js';

export async function getDashboardKpisController(req, res) {
  const kpis = await getDashboardKpis();

  return sendSuccess(res, {
    message: MESSAGES.DASHBOARD.KPIS_FETCH_SUCCESS,
    data: toDashboardKpisResponseDto(kpis),
  });
}

export async function getDashboardOverviewController(req, res) {
  const overview = await getDashboardOverview({ email: req.user?.email });

  return sendSuccess(res, {
    message: MESSAGES.DASHBOARD.OVERVIEW_FETCH_SUCCESS,
    data: toDashboardOverviewResponseDto(overview),
  });
}