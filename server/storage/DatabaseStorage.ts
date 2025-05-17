import { 
  users, 
  contracts, 
  templates, 
  clients, 
  clauses,
  aiConversations,
  lawyers as lawyersTable,
  consultations,
  type User, 
  type InsertUser, 
  type Contract, 
  type InsertContract,
  type Template,
  type InsertTemplate,
  type Client,
  type InsertClient,
  type Clause,
  type InsertClause,
  type AIConversation,
  type InsertAIConversation,
  type Lawyer,
  type Consultation,
  type InsertConsultation
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, asc } from "drizzle-orm";
import { IStorage } from "../storage";

// Define types needed for compatibility with the IStorage interface
interface Subscription {
  planId: string;
  status: "active" | "canceled" | "past_due";
  startDate: string;
  endDate: string;
  paymentMethod: string;
  autoRenew: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "failed";
  description: string;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // No initialization of sample data
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Contract methods
  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async getAllContracts(): Promise<Contract[]> {
    return db.select().from(contracts);
  }

  async getRecentContracts(limit: number = 5): Promise<Contract[]> {
    return db
      .select()
      .from(contracts)
      .orderBy(desc(contracts.updatedAt))
      .limit(limit);
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [created] = await db.insert(contracts).values(contract).returning();
    return created;
  }

  async updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updated] = await db
      .update(contracts)
      .set({ ...contractData, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
      
    return updated;
  }
  
  // Template methods
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async getAllTemplates(): Promise<Template[]> {
    return db.select().from(templates);
  }

  async getPopularTemplates(limit: number = 3): Promise<Template[]> {
    return db
      .select()
      .from(templates)
      .where(eq(templates.isPublic, true))
      .limit(limit);
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [created] = await db.insert(templates).values(template).returning();
    return created;
  }
  
  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }
  
  // Clause methods
  async getClause(id: number): Promise<Clause | undefined> {
    const [clause] = await db.select().from(clauses).where(eq(clauses.id, id));
    return clause;
  }

  async getAllClauses(): Promise<Clause[]> {
    return db.select().from(clauses);
  }

  async createClause(clause: InsertClause): Promise<Clause> {
    const [created] = await db.insert(clauses).values(clause).returning();
    return created;
  }
  
  // AI Conversation methods
  async getConversation(id: number): Promise<AIConversation | undefined> {
    const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertAIConversation): Promise<AIConversation> {
    const [created] = await db.insert(aiConversations).values(conversation).returning();
    return created;
  }

  async updateConversation(id: number, data: Partial<InsertAIConversation>): Promise<AIConversation | undefined> {
    const [updated] = await db
      .update(aiConversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
      
    return updated;
  }
  
  // Marketplace methods
  async getAllLawyers(): Promise<Lawyer[]> {
    return db.select().from(lawyersTable);
  }

  async getLawyer(id: number): Promise<Lawyer | undefined> {
    const [lawyer] = await db.select().from(lawyersTable).where(eq(lawyersTable.id, id));
    return lawyer;
  }
  
  // Consultation methods
  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [created] = await db.insert(consultations).values(consultation).returning();
    return created;
  }

  async getConsultation(id: number): Promise<Consultation | undefined> {
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
    return consultation;
  }

  async getUserConsultations(userId: number): Promise<Consultation[]> {
    return db.select().from(consultations).where(eq(consultations.userId, userId));
  }

  async updateConsultation(id: number, data: Partial<InsertConsultation>): Promise<Consultation | undefined> {
    const [updated] = await db
      .update(consultations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(consultations.id, id))
      .returning();
      
    return updated;
  }
  
  // Billing methods (Limited database implementation for now)
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    // This would typically involve a proper database query once we have a subscription table
    // For now, return undefined
    return undefined;
  }

  async getUserInvoices(userId: number): Promise<Invoice[]> {
    // This would typically involve a proper database query once we have an invoices table
    // For now, return an empty array
    return [];
  }
}