import type { DemoDataset, InspectionRecord, ProductionOrder } from "./types";

export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
export const pct = (numerator: number, denominator: number) => denominator > 0 ? (numerator / denominator) * 100 : null;
export const ppm = (defective: number, inspected: number) => inspected > 0 ? (defective / inspected) * 1_000_000 : null;
export const productionAchievement = (orders: ProductionOrder[]) => pct(sum(orders.map((order) => order.actual)), sum(orders.map((order) => order.planned)));
export const firstPassYield = (records: InspectionRecord[]) => pct(sum(records.map((record) => record.inspected - record.failed)), sum(records.map((record) => record.inspected)));
export const defectPpm = (records: InspectionRecord[]) => ppm(sum(records.map((record) => record.failed)), sum(records.map((record) => record.inspected)));
export const reworkCost = (records: InspectionRecord[]) => sum(records.map((record) => record.reworkCostInr));

export const inRange = <T extends { date?: string; timestamp?: string }>(rows: T[], from: string, to: string) => rows.filter((row) => {
  const value = row.date ?? row.timestamp;
  return value !== undefined && value >= from && value < to;
});

export const snapshotMetrics = (data: DemoDataset, from: string, to: string) => {
  const orders = data.orders.filter((order) => order.date >= from && order.date < to);
  const orderIds = new Set(orders.map((order) => order.id));
  const inspections = data.inspections.filter((record) => orderIds.has(record.orderId));
  const deliveries = data.deliveries.filter((delivery) => delivery.receivedAt >= from && delivery.receivedAt < to);
  const onTimeInFull = deliveries.filter((delivery) => delivery.receivedAt <= delivery.promisedAt && delivery.receivedUnits >= delivery.orderedUnits).length;
  const downtimeMinutes = sum(data.downtime.filter((event) => orderIds.has(event.orderId) && !event.planned).map((event) => event.minutes));
  const defectiveUnits = sum(inspections.map((record) => record.failed));
  const inspectedUnits = sum(inspections.map((record) => record.inspected));
  return {
    orders,
    inspections,
    productionAchievement: productionAchievement(orders),
    firstPassYield: firstPassYield(inspections),
    defectPpm: defectPpm(inspections),
    downtimeMinutes,
    otif: deliveries.length ? pct(onTimeInFull, deliveries.length) : null,
    reworkCostInr: reworkCost(inspections),
    openQualityAlerts: 1,
    atRiskLots: data.inventory.filter((snapshot) => {
      const component = data.components.find((item) => item.id === snapshot.componentId);
      return component !== undefined && snapshot.availableUnits < component.safetyStock;
    }).length,
    inspectedUnits,
    defectiveUnits,
  };
};

export const dailyTrend = (data: DemoDataset, offsets: number[]) => offsets.map((offset) => {
  const start = new Date(Date.parse("2026-10-19T12:00:00.000Z") - (offset + 1) * 86_400_000).toISOString();
  const end = new Date(Date.parse("2026-10-19T12:00:00.000Z") - offset * 86_400_000).toISOString();
  const metrics = snapshotMetrics(data, start, end);
  return { day: new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" }), production: Math.round(metrics.productionAchievement ?? 0), fpy: Math.round(metrics.firstPassYield ?? 0), defects: metrics.defectPpm ?? 0, rework: metrics.reworkCostInr };
});

export const comparePeriods = (data: DemoDataset) => {
  const anchor = Date.parse("2026-10-19T12:00:00.000Z");
  const current = snapshotMetrics(data, new Date(anchor - 30 * 86_400_000).toISOString(), new Date(anchor + 1).toISOString());
  const previous = snapshotMetrics(data, new Date(anchor - 60 * 86_400_000).toISOString(), new Date(anchor - 30 * 86_400_000).toISOString());
  return { current, previous };
};