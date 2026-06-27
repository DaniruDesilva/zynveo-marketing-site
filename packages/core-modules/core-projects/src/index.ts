import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { 
  projects, 
  tasks, 
  rentalAssets, 
  rentals 
} from '@erp/database';

export class ProjectService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Initializes a new project
   */
  async createProject(tenantId: string, data: { name: string; customerId?: string; budget?: string }) {
    const [project] = await this.db.insert(projects).values({
      tenantId,
      customerId: data.customerId,
      name: data.name,
      budget: data.budget
    }).returning();
    return project;
  }

  /**
   * Adds a task to a project board
   */
  async addTask(tenantId: string, projectId: string, title: string, estimatedHours?: string) {
    const [task] = await this.db.insert(tasks).values({
      tenantId,
      projectId,
      title,
      estimatedHours
    }).returning();
    return task;
  }

  /**
   * Books a rental asset for a customer
   */
  async bookRental(tenantId: string, customerId: string, assetId: string, startDate: Date, endDate: Date, projectId?: string) {
    // Basic availability check should go here in a production system
    
    // Calculate total cost (assuming asset.dailyRate is fetched prior)
    const assetRow = await this.db.select().from(rentalAssets).where(eq(rentalAssets.id, assetId)).limit(1);
    if (!assetRow.length) throw new Error("Asset not found");

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalCost = String(days * parseFloat(assetRow[0].dailyRate));

    const [rental] = await this.db.insert(rentals).values({
      tenantId,
      customerId,
      assetId,
      projectId,
      startDate,
      endDate,
      totalCost,
      status: 'reserved'
    }).returning();

    return rental;
  }
}
