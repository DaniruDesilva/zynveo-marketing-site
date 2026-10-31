import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { customers, communicationLogs, complaintTickets } from '@zynveo/database';

export type TicketSeverityUpper = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function calculateSlaDeadline(
  severity: TicketSeverityUpper | 'low' | 'medium' | 'high' | 'critical' = 'LOW',
  fromDate: Date = new Date(),
): Date {
  const norm = severity.toUpperCase();
  let hoursToResolve = 48;
  if (norm === 'MEDIUM') hoursToResolve = 24;
  if (norm === 'HIGH') hoursToResolve = 8;
  if (norm === 'CRITICAL') hoursToResolve = 2;

  return new Date(fromDate.getTime() + hoursToResolve * 60 * 60 * 1000);
}

export class CrmService {
  constructor(private db: any) {}

  async registerCustomer(
    tenantId: string,
    data: { name: string; email?: string; phone?: string; company?: string },
  ) {
    const [customer] = await this.db
      .insert(customers as any)
      .values({
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
      })
      .returning();
    return customer;
  }

  async logInteraction(tenantId: string, customerId: string, type: string, notes: string) {
    const [log] = await this.db
      .insert(communicationLogs as any)
      .values({
        tenantId,
        customerId,
        type,
        notes,
      })
      .returning();
    return log;
  }

  async openTicket(
    tenantId: string,
    customerId: string,
    subject: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' | TicketSeverityUpper = 'LOW',
  ) {
    const slaDeadline = calculateSlaDeadline(severity);

    const [ticket] = await this.db
      .insert(complaintTickets as any)
      .values({
        tenantId,
        customerId,
        subject,
        description,
        severity: severity.toUpperCase(),
        slaDeadline,
      })
      .returning();
    return ticket;
  }
}
