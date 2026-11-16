import Decimal from 'decimal.js';
import { eq, and, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { 
  projects, 
  tasks, 
  rentalAssets, 
  rentals 
} from '@zynveo/database';

export class ProjectService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Initializes a new project
   */
  async createProject(tenantId: string, data: { name: string; customerId?: string; budget?: string }) {
    const budget =
      data.budget !== undefined
        ? new Decimal(data.budget).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)
        : undefined;
    const [project] = await this.db.insert(projects).values({
      tenantId,
      customerId: data.customerId,
      name: data.name,
      budget,
    }).returning();
    return project;
  }

  /**
   * Adds a task to a project board
   */
  async addTask(tenantId: string, projectId: string, title: string, estimatedHours?: string) {
    const hours =
      estimatedHours !== undefined
        ? new Decimal(estimatedHours).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4)
        : undefined;
    const [task] = await this.db.insert(tasks).values({
      tenantId,
      projectId,
      title,
      estimatedHours: hours,
    }).returning();
    return task;
  }

  /**
   * Books a rental asset for a customer
   */
  async bookRental(tenantId: string, customerId: string, assetId: string, startDate: Date, endDate: Date, projectId?: string) {
    const assetRow = await this.db
      .select()
      .from(rentalAssets)
      .where(
        and(
          eq(rentalAssets.id, assetId),
          eq(rentalAssets.tenantId, tenantId),
          isNull(rentalAssets.deletedAt),
        ),
      )
      .limit(1);
    if (!assetRow.length) throw new Error('Asset not found');

    const elapsedMs = Math.max(0, endDate.getTime() - startDate.getTime());
    const days = Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
    const totalCost = new Decimal(days)
      .times(new Decimal(assetRow[0].dailyRate))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toFixed(2);

    const [rental] = await this.db.insert(rentals).values({
      tenantId,
      customerId,
      assetId,
      projectId,
      startDate,
      endDate,
      totalCost,
      status: 'RESERVED',
    }).returning();

    return rental;
  }
}
