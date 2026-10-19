import type { Component, ComponentLot, DemoDataset, InspectionRecord, ProductionOrder } from "./types";

const ANCHOR = Date.parse("2026-10-19T12:00:00.000Z");
const day = (offset: number) => new Date(ANCHOR - offset * 86_400_000).toISOString();

export const DEMO_ANCHOR = new Date(ANCHOR).toISOString();
export const INCIDENT_LOT_ID = "LOT-BRK-042";
export const INCIDENT_ALERT_ID = "QAL-2026-042";

export const initialAlerts = [
  {
    id: INCIDENT_ALERT_ID,
    title: "Brake actuator inspection failures elevated",
    severity: "high" as const,
    status: "Investigating" as const,
    summary: "A higher inspection failure frequency is associated with component lot LOT-BRK-042. Association is not proof of cause.",
    source: INCIDENT_LOT_ID,
    createdAt: day(2),
  },
  {
    id: "SUP-2026-018",
    title: "Steering gear delivery is 2 days late",
    severity: "medium" as const,
    status: "Open" as const,
    summary: "One delayed purchase order may reduce steering gear inventory coverage for an upcoming order.",
    source: "PO-78018",
    createdAt: day(1),
  },
  {
    id: "OPS-2026-011",
    title: "Assembly line 2 output below plan",
    severity: "low" as const,
    status: "Open" as const,
    summary: "Shortfall is concentrated in two second-shift orders with logged unplanned downtime.",
    source: "LINE-02",
    createdAt: day(0),
  },
];

const components: Component[] = [
  { id: "CMP-BRAKE-01", name: "Brake actuator", category: "Brake system", safetyStock: 520, unitCostInr: 8400 },
  { id: "CMP-STEER-02", name: "Steering gear", category: "Steering", safetyStock: 410, unitCostInr: 12600 },
  { id: "CMP-DOOR-03", name: "Sliding door roller", category: "Body systems", safetyStock: 780, unitCostInr: 2150 },
  { id: "CMP-COOL-04", name: "Cooling fan assembly", category: "Thermal", safetyStock: 300, unitCostInr: 3900 },
  { id: "CMP-CLUTCH-05", name: "Clutch pressure plate", category: "Drivetrain", safetyStock: 350, unitCostInr: 5100 },
];

const lots: ComponentLot[] = [
  { id: INCIDENT_LOT_ID, componentId: "CMP-BRAKE-01", supplierId: "SUP-01", receivedAt: day(16), quantity: 240, affected: true },
  { id: "LOT-BRK-039", componentId: "CMP-BRAKE-01", supplierId: "SUP-02", receivedAt: day(28), quantity: 420, affected: false },
  { id: "LOT-BRK-038", componentId: "CMP-BRAKE-01", supplierId: "SUP-01", receivedAt: day(47), quantity: 380, affected: false },
  { id: "LOT-STR-021", componentId: "CMP-STEER-02", supplierId: "SUP-03", receivedAt: day(9), quantity: 310, affected: false },
  { id: "LOT-DR-056", componentId: "CMP-DOOR-03", supplierId: "SUP-04", receivedAt: day(13), quantity: 690, affected: false },
  { id: "LOT-COOL-014", componentId: "CMP-COOL-04", supplierId: "SUP-02", receivedAt: day(18), quantity: 275, affected: false },
  { id: "LOT-CL-032", componentId: "CMP-CLUTCH-05", supplierId: "SUP-05", receivedAt: day(23), quantity: 320, affected: false },
];

const lotForOrder = (n: number, offset: number): ComponentLot => {
  if (offset >= 13 && offset <= 17 && n % 4 !== 0) return lots[0];
  const pool = lots.slice(1);
  return pool[(n * 3 + offset) % pool.length];
};

const makeOrders = () => {
  const orders: ProductionOrder[] = [];
  for (let offset = 0; offset < 90; offset += 1) {
    for (let slot = 0; slot < 8; slot += 1) {
      const n = offset * 8 + slot;
      const plan = 18 + ((n * 7) % 16);
      const slightShortfall = (n * 13) % 21 === 0 ? 5 : ((n * 5) % 7 === 0 ? 2 : 0);
      const lot = lotForOrder(n, offset);
      orders.push({
        id: `PO-${String(n + 1).padStart(5, "0")}`,
        date: day(offset),
        plantId: slot < 5 ? "PLT-PUNE" : "PLT-INDORE",
        line: `LINE-${String((slot % 4) + 1).padStart(2, "0")}`,
        shift: (["A", "B", "C"] as const)[(n + offset) % 3],
        productFamily: slot % 3 === 0 ? "Traveller" : slot % 3 === 1 ? "Urbania" : "Monobus",
        planned: plan,
        actual: Math.max(0, plan - slightShortfall),
        componentLotId: lot.id,
        buildId: `VB-${String(n + 1).padStart(6, "0")}`,
      });
    }
  }
  return orders;
};

const makeInspection = (order: ProductionOrder, index: number, lot: ComponentLot): InspectionRecord => {
  const inspected = order.actual;
  const incidentAffected = lot.affected && order.date >= day(17) && order.date <= day(13);
  const failed = incidentAffected ? 4 + (index % 4) : index % 13 === 0 ? 2 : index % 4 === 0 ? 1 : 0;
  return {
    id: `INSP-${String(index + 1).padStart(5, "0")}`,
    orderId: order.id,
    buildId: order.buildId,
    lotId: lot.id,
    inspected,
    failed: Math.min(failed, inspected),
    defectCategory: failed > 0 ? incidentAffected ? "Brake actuator leak" : index % 2 === 0 ? "Door alignment" : "Surface finish" : null,
    reworkUnits: failed > 0 ? Math.max(1, Math.round(failed * 0.7)) : 0,
    reworkCostInr: failed > 0 ? Math.max(1, Math.round(failed * 0.7)) * (incidentAffected ? 6750 : 1850) : 0,
    timestamp: order.date,
  };
};

export const createDataset = (): DemoDataset => {
  const orders = makeOrders();
  const inspections = orders.map((order, index) => {
    const lot = lots.find((entry) => entry.id === order.componentLotId);
    if (!lot) throw new Error(`Missing component lot for ${order.id}`);
    return makeInspection(order, index, lot);
  });
  const downtime = orders.filter((_, index) => index % 9 === 0).map((order, index) => ({
    id: `DT-${String(index + 1).padStart(4, "0")}`,
    orderId: order.id,
    machine: `M-${String((index % 14) + 1).padStart(2, "0")}`,
    minutes: 12 + ((index * 19) % 67),
    planned: index % 4 === 0,
    reason: ["Tool change", "Sensor fault", "Material wait", "Conveyor reset"][index % 4],
    timestamp: order.date,
  }));
  const deliveries = Array.from({ length: 84 }, (_, index) => {
    const lot = lots[index % lots.length];
    const supplierIndex = index % 5;
    const lateDays = index % 11 === 0 ? 2 + index % 2 : 0;
    const promised = new Date(ANCHOR - (index + 4) * 86400000);
    const received = new Date(promised.getTime() + lateDays * 86400000);
    return {
      id: `DEL-${String(index + 1).padStart(4, "0")}`,
      supplierId: `SUP-0${supplierIndex + 1}`,
      lotId: lot.id,
      purchaseOrder: `PO-${78000 + index}`,
      promisedAt: promised.toISOString(),
      receivedAt: received.toISOString(),
      orderedUnits: 220 + ((index * 37) % 360),
      receivedUnits: index % 17 === 0 ? 190 + ((index * 13) % 90) : 220 + ((index * 37) % 360),
    };
  });
  const inventory = components.map((component, index) => ({
    componentId: component.id,
    availableUnits: [390, 188, 960, 260, 332][index],
    averageDailyUse: [34, 24, 55, 18, 19][index],
    updatedAt: day(0),
  }));
  const serviceIncidents = Array.from({ length: 96 }, (_, index) => ({
    id: `WARR-${String(index + 1).padStart(4, "0")}`,
    buildId: `VB-${String(orders[(index * 13) % orders.length]?.buildId ?? "000001").replace("VB-", "")}`,
    failureCode: index % 7 < 3 ? "BRK-ACT-07" : index % 2 ? "DOOR-ROLLER-02" : "CLUTCH-VIB-11",
    date: day(index % 89),
    componentId: index % 7 < 3 ? "CMP-BRAKE-01" : index % 2 ? "CMP-DOOR-03" : "CMP-CLUTCH-05",
  }));
  return {
    plants: [{ id: "PLT-PUNE", name: "West Assembly", city: "Pune" }, { id: "PLT-INDORE", name: "Central Works", city: "Indore" }],
    suppliers: [
      { id: "SUP-01", name: "Aster Motion Systems", region: "Pune, IN" },
      { id: "SUP-02", name: "Vector Components", region: "Chennai, IN" },
      { id: "SUP-03", name: "Keystone Steering", region: "Nashik, IN" },
      { id: "SUP-04", name: "Northline Body Systems", region: "Vadodara, IN" },
      { id: "SUP-05", name: "Summit Drivetrain", region: "Coimbatore, IN" },
    ],
    components,
    lots,
    orders,
    inspections,
    downtime,
    deliveries,
    inventory,
    serviceIncidents,
  };
};

export const makeEmptyDataset = (): DemoDataset => createDataset();

export const incidentPopulation = (dataset: DemoDataset) => {
  const affectedOrders = dataset.orders.filter((order) => order.componentLotId === INCIDENT_LOT_ID);
  const affectedInspections = dataset.inspections.filter((record) => record.lotId === INCIDENT_LOT_ID);
  const comparisonOrders = dataset.orders.filter((order) => order.componentLotId !== INCIDENT_LOT_ID && order.productFamily === affectedOrders[0]?.productFamily);
  const comparisonInspections = dataset.inspections.filter((record) => comparisonOrders.some((order) => order.id === record.orderId));
  return { affectedOrders, affectedInspections, comparisonOrders, comparisonInspections };
};