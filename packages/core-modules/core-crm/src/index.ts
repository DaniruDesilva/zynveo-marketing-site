import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { 
  customers, 
  communicationLogs, 
  complaintTickets 
} from '@erp/database';

export class CrmService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Registers a new customer in the CRM
   */
  async registerCustomer(tenantId: string, data: { name: string; email?: string; phone?: string; company?: string }) {
    const [customer] = await this.db.insert(customers).values({
      tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company
    }).returning();
    return customer;
  }

  /**
   * Logs a communication interaction with a customer
   */
  async logInteraction(tenantId: string, customerId: string, type: string, notes: string) {
    const [log] = await this.db.insert(communicationLogs).values({
      tenantId,
      customerId,
      type,
      notes
    }).returning();
    return log;
  }

  /**
   * Opens a new complaint ticket with automatic SLA tracking
   */
  async openTicket(tenantId: string, customerId: string, subject: string, description: string, severity: "low" | "medium" | "high" | "critical" = "low") {
    // Basic SLA logic based on severity
    let hoursToResolve = 48; // default low
    if (severity === 'medium') hoursToResolve = 24;
    if (severity === 'high') hoursToResolve = 8;
    if (severity === 'critical') hoursToResolve = 2;

    const slaDeadline = new Date(Date.now() + hoursToResolve * 60 * 60 * 1000);

    const [ticket] = await this.db.insert(complaintTickets).values({
      tenantId,
      customerId,
      subject,
      description,
      severity,
      slaDeadline
    }).returning();
    return ticket;
  }
}
