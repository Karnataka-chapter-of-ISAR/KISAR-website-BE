import { getDashboardKpis, getDashboardOverview } from '../services/dashboard.service.js';
import { getRecentActivity } from '../services/activity.service.js';
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

export async function getRecentActivityController(req, res) {
  const activities = await getRecentActivity();

  return sendSuccess(res, {
    message: activities.length === 0 ? MESSAGES.DASHBOARD.NO_ACTIVITY : MESSAGES.DASHBOARD.ACTIVITY_FETCH_SUCCESS,
    data: { activities },
  });
}

export async function getDashboardOverviewController(req, res) {
  const overview = await getDashboardOverview({ email: req.user?.email });

  return sendSuccess(res, {
    message: MESSAGES.DASHBOARD.OVERVIEW_FETCH_SUCCESS,
    data: toDashboardOverviewResponseDto(overview),
  });
}