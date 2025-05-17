import { 
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

// Types for additional data models
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

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  
  // Contract methods
  getContract(id: number): Promise<Contract | undefined>;
  getAllContracts(): Promise<Contract[]>;
  getRecentContracts(limit?: number): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract | undefined>;
  
  // Template methods
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getPopularTemplates(limit?: number): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Clause methods
  getClause(id: number): Promise<Clause | undefined>;
  getAllClauses(): Promise<Clause[]>;
  createClause(clause: InsertClause): Promise<Clause>;
  
  // AI Conversation methods
  getConversation(id: number): Promise<AIConversation | undefined>;
  createConversation(conversation: InsertAIConversation): Promise<AIConversation>;
  updateConversation(id: number, data: Partial<InsertAIConversation>): Promise<AIConversation | undefined>;
  
  // Marketplace methods
  getAllLawyers(): Promise<Lawyer[]>;
  getLawyer(id: number): Promise<Lawyer | undefined>;
  
  // Consultation methods
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultation(id: number): Promise<Consultation | undefined>;
  getUserConsultations(userId: number): Promise<Consultation[]>;
  updateConsultation(id: number, data: Partial<InsertConsultation>): Promise<Consultation | undefined>;
  
  // Billing methods
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  getUserInvoices(userId: number): Promise<Invoice[]>;
}

// Import the DatabaseStorage class
import { DatabaseStorage } from "./storage/DatabaseStorage";

// Use DatabaseStorage
export const storage = new DatabaseStorage();