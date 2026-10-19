export type Shift = "A" | "B" | "C";
export type Severity = "critical" | "high" | "medium" | "low";

export interface Plant {
  id: string;
  name: string;
  city: string;
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  safetyStock: number;
  unitCostInr: number;
}

export interface ComponentLot {
  id: string;
  componentId: string;
  supplierId: string;
  receivedAt: string;
  quantity: number;
  affected: boolean;
}

export interface ProductionOrder {
  id: string;
  date: string;
  plantId: string;
  line: string;
  shift: Shift;
  productFamily: string;
  planned: number;
  actual: number;
  componentLotId: string;
  buildId: string;
}

export interface InspectionRecord {
  id: string;
  orderId: string;
  buildId: string;
  lotId: string;
  inspected: number;
  failed: number;
  defectCategory: string | null;
  reworkUnits: number;
  reworkCostInr: number;
  timestamp: string;
}

export interface DowntimeEvent {
  id: string;
  orderId: string;
  machine: string;
  minutes: number;
  planned: boolean;
  reason: string;
  timestamp: string;
}

export interface Delivery {
  id: string;
  supplierId: string;
  lotId: string;
  purchaseOrder: string;
  promisedAt: string;
  receivedAt: string;
  orderedUnits: number;
  receivedUnits: number;
}

export interface InventorySnapshot {
  componentId: string;
  availableUnits: number;
  averageDailyUse: number;
  updatedAt: string;
}

export interface ServiceIncident {
  id: string;
  buildId: string;
  failureCode: string;
  date: string;
  componentId: string;
}

export interface DemoDataset {
  plants: Plant[];
  suppliers: Supplier[];
  components: Component[];
  lots: ComponentLot[];
  orders: ProductionOrder[];
  inspections: InspectionRecord[];
  downtime: DowntimeEvent[];
  deliveries: Delivery[];
  inventory: InventorySnapshot[];
  serviceIncidents: ServiceIncident[];
}

export interface OperationalAlert {
  id: string;
  title: string;
  severity: Severity;
  status: "Open" | "Investigating" | "Resolved";
  summary: string;
  source: string;
  createdAt: string;
}

export interface InvestigationRun {
  id: string;
  agent: string;
  startedAt: string;
  status: "Complete" | "Failed";
  summary: string;
  evidenceIds: string[];
  steps: string[];
}

export interface WorkflowRun {
  id: string;
  workflow: string;
  startedAt: string;
  status: "Success" | "Skipped" | "Failed";
  steps: string[];
  outcome: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

export interface PipelineRun {
  id: string;
  startedAt: string;
  status: "Success" | "Attention required";
  sourceRecords: number;
  acceptedRecords: number;
  rejectedRecords: number;
  checks: { name: string; passed: number; rejected: number; detail: string }[];
}

export interface DemoThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: { id: string; role: "user" | "assistant"; text: string; evidenceIds: string[]; timestamp: string }[];
}

export interface DemoState {
  alerts: OperationalAlert[];
  agentRuns: InvestigationRun[];
  workflowRuns: WorkflowRun[];
  audit: AuditEvent[];
  pipelineRuns: PipelineRun[];
  threads: DemoThread[];
  guidedStep: number;
  role: "Executive" | "Operations Manager" | "Quality Analyst" | "Data Engineer";
}