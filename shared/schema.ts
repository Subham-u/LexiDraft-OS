import { pgTable, text, serial, integer, timestamp, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'pending', 'signed', 'expired', 'cancelled']);
export const contractTypeEnum = pgEnum('contract_type', [
  // Common Business Contracts
  'nda', 'freelance', 'employment', 'founder', 'lease', 
  // Indian Business & Commercial Contracts
  'sale_of_goods', 'distribution', 'franchise', 'agency', 'joint_venture', 'partnership',
  // Service Contracts
  'consulting', 'outsourcing', 'maintenance', 'logistics',
  // Financial Contracts
  'loan', 'investment', 'venture_capital', 'guarantee', 'security', 
  // Real Estate
  'property_sale', 'rent_residential', 'rent_commercial', 'construction', 'development',
  // Intellectual Property
  'ip_licensing', 'ip_transfer', 'technology_transfer', 'software_development', 'publishing',
  // Specific to Indian Markets
  'e_commerce', 'startup_incorporation', 'fdi_compliance', 'gst_compliance', 'msme',
  // Miscellaneous
  'other'
]);
export const partyRoleEnum = pgEnum('party_role', ['client', 'provider', 'employer', 'employee', 'lessor', 'lessee', 'other']);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contracts
export const contracts = pgTable('contracts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: contractTypeEnum('type').notNull(),
  content: text('content').notNull(),
  status: contractStatusEnum('status').default('draft').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  pdfUrl: text('pdf_url'),
  parties: json('parties').$type<Party[]>().notNull(),
  clauses: json('clauses').$type<Clause[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Templates
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: contractTypeEnum('type').notNull(),
  content: text('content').notNull(),
  description: text('description').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  userId: integer('user_id').references(() => users.id),
  clauses: json('clauses').$type<Clause[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clients
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  address: text('address'),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clauses
export const clauses = pgTable('clauses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Conversations
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  messages: json('messages').$type<AIMessage[]>().notNull(),
  context: text('context'),
  contractId: integer('contract_id').references(() => contracts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Custom types
export type Party = {
  name: string;
  role: string;
  email?: string;
  address?: string;
};

export type Clause = {
  id: string;
  title: string;
  content: string;
  explanation?: string;
};

export type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

// Lawyer Marketplace Types
export const lawyerPracticeAreaEnum = pgEnum('practice_area', [
  'contract_law',
  'property_law',
  'criminal_law',
  'corporate_law',
  'family_law',
  'intellectual_property',
  'startup_law',
  'real_estate',
  'tax_law',
  'employment_law',
  'immigration_law',
  'environmental_law',
  'bankruptcy_law',
  'constitutional_law',
  'entertainment_law',
  'medical_law',
  'cyber_law',
  'international_law',
  'human_rights',
  'other'
]);

export const consultationModeEnum = pgEnum('consultation_mode', [
  'video',
  'call',
  'chat'
]);

export const consultationStatusEnum = pgEnum('consultation_status', [
  'scheduled',
  'ongoing',
  'completed',
  'cancelled',
  'no_show'
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'verified',
  'rejected'
]);

// Lawyer profile schema
export const lawyers = pgTable('lawyers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  profilePhoto: text('profile_photo'),
  about: text('about'),
  barCouncilId: text('bar_council_id'),
  practiceAreas: text('practice_areas').array().notNull(),
  specializations: text('specializations').array(),
  experience: integer('experience').notNull().default(0),
  languages: text('languages').array().notNull(),
  location: json('location').notNull(), // { country, state, city }
  rating: integer('rating').default(0),
  reviewCount: integer('review_count').default(0),
  hourlyRate: integer('hourly_rate').notNull(),
  isAvailable: boolean('is_available').default(true),
  availabilityCalendar: json('availability_calendar'),
  verified: boolean('verified').default(false),
  verifications: json('verifications').default({
    barCouncil: false,
    aadhaar: false,
    email: false,
    phone: false,
    lexiScreened: false
  }),
  awards: json('awards').array(),
  education: json('education').array(),
  consultationModes: text('consultation_modes').array(),
  badges: text('badges').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Lawyer review schema
export const lawyerReviews = pgTable('lawyer_reviews', {
  id: serial('id').primaryKey(),
  lawyerId: integer('lawyer_id').references(() => lawyers.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  consultationId: integer('consultation_id'), // Optional reference to a specific consultation
  createdAt: timestamp('created_at').defaultNow()
});

// Legal consultation schema
export const consultations = pgTable('consultations', {
  id: serial('id').primaryKey(),
  lawyerId: integer('lawyer_id').references(() => lawyers.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  duration: integer('duration').notNull(), // in minutes
  mode: consultationModeEnum('mode').notNull(),
  status: consultationStatusEnum('status').default('scheduled'),
  documents: json('documents').array(),
  price: integer('price').notNull(),
  paymentStatus: text('payment_status').default('pending'),
  paymentId: text('payment_id'),
  notes: text('notes'),
  transcription: text('transcription'),
  lexiAssistEnabled: boolean('lexi_assist_enabled').default(false),
  lexiCertId: text('lexi_cert_id'),
  feedbackId: integer('feedback_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Documents shared during consultations
export const sharedDocuments = pgTable('shared_documents', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => consultations.id).notNull(),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
  type: text('type'),
  size: integer('size'),
  createdAt: timestamp('created_at').defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClauseSchema = createInsertSchema(clauses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAIConversationSchema = createInsertSchema(aiConversations).omit({ id: true, createdAt: true, updatedAt: true });

// Lawyer marketplace schema inserts
export const insertLawyerSchema = createInsertSchema(lawyers);
export const insertLawyerReviewSchema = createInsertSchema(lawyerReviews);
export const insertConsultationSchema = createInsertSchema(consultations);
export const insertSharedDocumentSchema = createInsertSchema(sharedDocuments);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type ClauseModel = typeof clauses.$inferSelect;
export type InsertClause = z.infer<typeof insertClauseSchema>;

export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;

// Lawyer marketplace types
export type Lawyer = typeof lawyers.$inferSelect;
export type InsertLawyer = z.infer<typeof insertLawyerSchema>;

export type LawyerReview = typeof lawyerReviews.$inferSelect;
export type InsertLawyerReview = z.infer<typeof insertLawyerReviewSchema>;

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;

export type SharedDocument = typeof sharedDocuments.$inferSelect;
export type InsertSharedDocument = z.infer<typeof insertSharedDocumentSchema>;
