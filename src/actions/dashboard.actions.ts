"use server";

import { getDashboardStats, getReporteGestionStats } from "@/services/dashboard.service";

export async function getDashboardStatsAction() {
  return await getDashboardStats();
}

export async function getReporteGestionStatsAction() {
  return await getReporteGestionStats();
}
