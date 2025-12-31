import ExcelJS from 'exceljs';
import { getTriggerPerformanceRanking } from './marketingAnalytics';
import { getTriggerTrends } from './marketingTrends';
import { getGroupComparison } from './abTesting';

export async function exportMarketingReport(params: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const workbook = new ExcelJS.Workbook();
  
  // 创建工作表
  const summarySheet = workbook.addWorksheet('营销效果总览');
  const trendsSheet = workbook.addWorksheet('趋势分析');
  
  // 获取数据
  const ranking = await getTriggerPerformanceRanking({
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    limit: params.limit,
  });
  const trends = await getTriggerTrends({
    startDate: params.startDate,
    endDate: params.endDate,
  });
  
  // 填充总览数据
  summarySheet.columns = [
    { header: '触发器ID', key: 'campaignId', width: 30 },
    { header: '订单数', key: 'totalOrders', width: 15 },
    { header: '总收入', key: 'totalRevenue', width: 15 },
    { header: '客单价', key: 'avgOrderValue', width: 15 },
  ];
  
  summarySheet.addRows(ranking);
  
  // 设置表头样式
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // 填充趋势数据
  trendsSheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '订单数', key: 'orderCount', width: 15 },
    { header: '收入', key: 'revenue', width: 15 },
  ];
  
  trendsSheet.addRows(trends);
  
  // 设置表头样式
  trendsSheet.getRow(1).font = { bold: true };
  trendsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // 生成 Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function exportABTestReport(groupTag: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('A/B 测试对比');
  
  // 获取数据
  const comparison = await getGroupComparison(groupTag);
  
  // 填充数据
  sheet.columns = [
    { header: '触发器ID', key: 'triggerId', width: 15 },
    { header: '触发器名称', key: 'triggerName', width: 30 },
    { header: '总订单数', key: 'totalOrders', width: 15 },
    { header: '总收入', key: 'totalRevenue', width: 15 },
    { header: '转化率', key: 'conversionRate', width: 15 },
    { header: '优惠券使用率', key: 'usageRate', width: 15 },
  ];
  
  const rows = comparison.map((item: any) => ({
    triggerId: item.triggerId,
    triggerName: item.triggerName,
    totalOrders: item.orderStats.totalOrders,
    totalRevenue: item.orderStats.totalRevenue,
    conversionRate: `${item.conversionRate}%`,
    usageRate: `${item.couponStats.usageRate}%`,
  }));
  
  sheet.addRows(rows);
  
  // 设置表头样式
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // 生成 Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
