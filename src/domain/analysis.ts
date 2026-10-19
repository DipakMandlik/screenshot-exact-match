import { incidentPopulation, INCIDENT_LOT_ID } from "./data";
import { defectPpm, firstPassYield, pct, reworkCost, snapshotMetrics, sum } from "./metrics";
import type { DemoDataset, DemoThread, OperationalAlert } from "./types";

export const qualityInvestigation = (data: DemoDataset) => {
  const groups = incidentPopulation(data);
  const affectedDefects = sum(groups.affectedInspections.map((record) => record.failed));
  const affectedInspected = sum(groups.affectedInspections.map((record) => record.inspected));
  const comparisonDefects = sum(groups.comparisonInspections.map((record) => record.failed));
  const comparisonInspected = sum(groups.comparisonInspections.map((record) => record.inspected));
  const affectedRate = affectedInspected ? (affectedDefects / affectedInspected) * 100 : 0;
  const comparisonRate = comparisonInspected ? (comparisonDefects / comparisonInspected) * 100 : 0;
  const relatedOrderIds = new Set(groups.affectedOrders.map((order) => order.id));
  const evidenceIds = groups.affectedInspections.filter((record) => record.failed > 0).slice(0, 8).map((record) => record.id);
  return {
    lotId: INCIDENT_LOT_ID,
    affectedOrders: groups.affectedOrders,
    affectedInspections: groups.affectedInspections,
    comparisonOrders: groups.comparisonOrders,
    comparisonInspections: groups.comparisonInspections,
    affectedDefects,
    affectedInspected,
    comparisonDefects,
    comparisonInspected,
    affectedRate,
    comparisonRate,
    ratio: comparisonRate > 0 ? affectedRate / comparisonRate : null,
    affectedFpy: firstPassYield(groups.affectedInspections),
    comparisonFpy: firstPassYield(groups.comparisonInspections),
    relatedOrderIds,
    evidenceIds,
    affectedPpm: defectPpm(groups.affectedInspections),
  };
};

export const supplierRisks = (data: DemoDataset) => data.inventory.map((snapshot) => {
  const component = data.components.find((entry) => entry.id === snapshot.componentId);
  const linkedLots = data.lots.filter((lot) => lot.componentId === snapshot.componentId);
  const openOrderIds = new Set(data.orders.filter((order) => linkedLots.some((lot) => lot.id === order.componentLotId)).map((order) => order.id));
  const shortage = component ? Math.max(0, component.safetyStock - snapshot.availableUnits) : 0;
  return {
    component,
    available: snapshot.availableUnits,
    coverage: snapshot.averageDailyUse > 0 ? snapshot.availableUnits / snapshot.averageDailyUse : null,
    safetyStock: component?.safetyStock ?? null,
    exposedOrders: openOrderIds.size,
    shortage,
    supplierNames: linkedLots.map((lot) => data.suppliers.find((supplier) => supplier.id === lot.supplierId)?.name).filter((name): name is string => name !== undefined),
  };
}).sort((left, right) => (left.coverage ?? Number.POSITIVE_INFINITY) - (right.coverage ?? Number.POSITIVE_INFINITY));

export const answerQuestion = (question: string, data: DemoDataset) => {
  const q = question.toLowerCase();
  const incident = qualityInvestigation(data);
  const period = snapshotMetrics(data, new Date(Date.parse("2026-10-19T12:00:00.000Z") - 7 * 86_400_000).toISOString(), "2026-10-20T00:00:00.000Z");
  const risks = supplierRisks(data);
  if (/defect|quality|batch|inspection|alert/.test(q)) {
    return {
      text: `**Quality alert · ${incident.lotId}**\n\nThe seeded comparison contains **${incident.affectedDefects} failures across ${incident.affectedInspected.toLocaleString()} inspections (${incident.affectedRate.toFixed(1)}%)** for the incident lot, versus **${incident.comparisonDefects} across ${incident.comparisonInspected.toLocaleString()} (${incident.comparisonRate.toFixed(1)}%)** in a same-family comparison group. This is an association, not proof that the lot or supplier caused the inspection failures.\n\n**Evidence:** ${incident.evidenceIds.join(", ")}. ${incident.affectedOrders.length} production orders link to the lot.\n\n**Next checks:** compare incoming inspection results, confirm process/tool calibration for matched shifts, and inspect retained samples before assigning cause. The sample is synthetic and does not represent any manufacturer's actual performance.`,
      evidenceIds: incident.evidenceIds,
    };
  }
  if (/supplier|delivery|shortage|inventory|stock/.test(q)) {
    const risk = risks[0];
    const late = data.deliveries.filter((delivery) => delivery.receivedAt > delivery.promisedAt);
    return {
      text: `**Supply risk · synthetic dataset**\n\n${risk.component?.name ?? "Inventory record"} has ${risk.available} available units against a ${risk.safetyStock ?? "unavailable"} unit safety-stock threshold, covering ${risk.coverage?.toFixed(1) ?? "unavailable"} days at the defined average use. ${risk.exposedOrders} production orders reference lots of this component.\n\nThere are ${late.length} late deliveries in the full sample. Delivery and inventory observations are simulated; validate current on-hand quantities and open purchase orders before acting.`,
      evidenceIds: [data.deliveries.find((delivery) => delivery.receivedAt > delivery.promisedAt)?.id ?? "DEL-0001"],
    };
  }
  if (/rework|cost/.test(q)) {
    const sevenDay = data.inspections.filter((record) => record.timestamp >= new Date(Date.parse("2026-10-19T12:00:00.000Z") - 7 * 86_400_000).toISOString());
    const cost = reworkCost(sevenDay);
    const focus = sevenDay.filter((record) => record.lotId === INCIDENT_LOT_ID);
    return {
      text: `**Rework exposure · last 7 days**\n\nThe modelled rework value is **₹${cost.toLocaleString("en-IN")}** across ${sum(sevenDay.map((record) => record.reworkUnits))} rework units. ${focus.length} inspection groups in the period use ${INCIDENT_LOT_ID}. Costs apply the sample's per-unit modelling assumptions and are not actual booked finance data.`,
      evidenceIds: sevenDay.filter((record) => record.reworkUnits > 0).slice(0, 6).map((record) => record.id),
    };
  }
  if (/shift|compare|production|output|downtime/.test(q)) {
    const byShift = (["A", "B", "C"] as const).map((shift) => {
      const shiftOrders = period.orders.filter((order) => order.shift === shift);
      return `${shift} shift: ${shiftOrders.length} orders, ${pct(sum(shiftOrders.map((order) => order.actual)), sum(shiftOrders.map((order) => order.planned)))?.toFixed(1) ?? "n/a"}% achievement`;
    });
    return {
      text: `**Production comparison · last 7 days**\n\n${byShift.join("\n\n")}\n\nOverall first-pass yield was ${period.firstPassYield?.toFixed(1) ?? "unavailable"}% with ${period.downtimeMinutes} unplanned downtime minutes in the synthetic sample. Order-level evidence is available in Manufacturing Intelligence.`,
      evidenceIds: period.orders.slice(0, 6).map((order) => order.id),
    };
  }
  if (/risk|priority|attention|summari/.test(q)) {
    const open = data.orders.length;
    return {
      text: `**Priority review · synthetic operations**\n\n1. Quality: ${INCIDENT_LOT_ID} is associated with ${incident.affectedRate.toFixed(1)}% inspection failures versus ${incident.comparisonRate.toFixed(1)}% in a comparison population.\n2. Supply: ${risks.filter((risk) => risk.shortage > 0).length} components are below configured safety stock; highest exposure is ${risks[0].component?.name ?? "unavailable"}.\n3. Production: ${period.downtimeMinutes} unplanned downtime minutes were logged in the last 7 days.\n\nThese are calculated from ${open.toLocaleString()} generated orders, not connected plant systems.`,
      evidenceIds: [...incident.evidenceIds.slice(0, 3), ...period.orders.slice(0, 2).map((order) => order.id)],
    };
  }
  if (/report|investigation/.test(q)) {
    return {
      text: `**Investigation report prepared**\n\nThe incident report includes the ${INCIDENT_LOT_ID} cohort, ${incident.affectedOrders.length} linked production orders, ${incident.affectedInspections.length} inspection records, a comparison population, ranked hypotheses, limitations, and recommended checks. Use **Open report** to review and print the current synthetic scenario.`,
      evidenceIds: incident.evidenceIds,
    };
  }
  return {
    text: "I can answer supported questions about the seeded quality alert, component lots, delivery and inventory risk, production output, downtime, rework costs, operational priorities, and the investigation report. This request did not match a supported analysis, so I have not inferred a result. Try one of the suggested questions below.",
    evidenceIds: [],
  };
};

export const buildReportText = (data: DemoDataset, alerts: OperationalAlert[]) => {
  const incident = qualityInvestigation(data);
  const rework = reworkCost(incident.affectedInspections);
  return `Automotive Intelligence Command Center — Synthetic Investigation Report\n\nIncident: Brake actuator inspection failures elevated\nReporting period: Seeded demonstration records linked to ${incident.lotId}\n\nAffected population: ${incident.affectedDefects} failures / ${incident.affectedInspected} inspected (${incident.affectedRate.toFixed(1)}%) across ${incident.affectedOrders.length} order records.\nComparison population: ${incident.comparisonDefects} failures / ${incident.comparisonInspected} inspected (${incident.comparisonRate.toFixed(1)}%) across ${incident.comparisonOrders.length} order records.\nModelled rework cost: ₹${rework.toLocaleString("en-IN")}\n\nHypotheses, not findings of proven cause:\n1. Incoming component variation — test retained samples and incoming inspection values.\n2. Assembly process or tool variation — compare tool calibration and matched shift records.\n3. Measurement/inspection variation — review gauge calibration and inspector agreement.\n\nLimitations: The entire dataset, assumed unit cost and execution histories are synthetic. Correlation does not prove a supplier or component caused a failure. No actual customer, factory, finance or warranty systems are connected.\n\nOpen alerts in this browser: ${alerts.filter((alert) => alert.status !== "Resolved").map((alert) => `${alert.id} (${alert.severity})`).join(", ") || "None"}\n\nEvidence: ${incident.evidenceIds.join(", ")}\n\nRecommended checks: verify inspection criteria; compare matched shifts and production tools; inspect retained samples; confirm event traceability before escalating.\n\nSynthetic demonstration output — not Force Motors or any manufacturer's operational record.`;
};

export const makeAssistantMessage = (thread: DemoThread, text: string, evidenceIds: string[]) => ({
  id: `msg-${thread.id}-${thread.messages.length + 1}`,
  role: "assistant" as const,
  text,
  evidenceIds,
  timestamp: new Date().toISOString(),
});