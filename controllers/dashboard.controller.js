import { getDashboardKpis } from '../services/dashboard.service.js';
import { toDashboardKpisResponseDto } from '../dto/dashboard/kpis.response.dto.js';
import { sendSuccess } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getDashboardKpisController(req, res) {
  const kpis = await getDashboardKpis();

  return sendSuccess(res, {
    message: MESSAGES.DASHBOARD.KPIS_FETCH_SUCCESS,
    data: toDashboardKpisResponseDto(kpis),
  });
}
