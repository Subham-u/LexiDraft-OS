import { Clause } from '@shared/schema';

// Define template interfaces
export interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  jurisdiction: string;
  clauses: Clause[];
  content?: string;
}

// Standard clauses that are common across many Indian contracts
export const commonIndianClauses: Clause[] = [
  { 
    id: 'indian-arbitration', 
    title: 'Arbitration Clause', 
    content: 'Any dispute arising out of or in connection with this contract shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India. The arbitral tribunal shall consist of a sole arbitrator appointed by mutual consent of the parties. The seat of arbitration shall be [CITY], India. The language of the arbitration shall be English. The decision of the arbitrator shall be final and binding on the parties.'
  },
  { 
    id: 'indian-governing-law', 
    title: 'Governing Law', 
    content: 'This Agreement shall be governed by and construed in accordance with the laws of India, without giving effect to any choice of law or conflict of law provisions.'
  },
  { 
    id: 'indian-force-majeure', 
    title: 'Force Majeure', 
    content: 'Neither party shall be liable for any failure to perform its obligations under this Agreement if such failure results from circumstances beyond that party\'s reasonable control, including but not limited to acts of God, natural disasters, pandemic, epidemic, war, civil disorder, governmental actions, or other similar events. The affected party shall notify the other party in writing within 7 days of the occurrence of such event and shall take reasonable steps to resume performance as soon as possible.'
  },
  { 
    id: 'indian-stamp-duty', 
    title: 'Stamp Duty Compliance', 
    content: 'The parties agree that this Agreement shall be properly stamped in accordance with the applicable Stamp Act in the relevant state of India where this Agreement is executed. Each party shall bear its own costs in relation to the stamping of this Agreement.'
  },
  { 
    id: 'indian-jurisdiction', 
    title: 'Jurisdiction', 
    content: 'Subject to the arbitration clause, the courts at [CITY], India shall have exclusive jurisdiction over any disputes arising under this Agreement.'
  },
  { 
    id: 'indian-gst', 
    title: 'GST Compliance', 
    content: 'All payments under this Agreement are exclusive of Goods and Services Tax (GST) which shall be payable by the appropriate party as per applicable laws. The party making the supply shall issue a proper tax invoice as required under the applicable GST laws.'
  },
  {
    id: 'indian-notices',
    title: 'Notices',
    content: 'All notices, requests, demands, and other communications under this Agreement shall be in writing and shall be deemed to have been duly given if delivered by hand, sent by registered post, courier, or electronic mail to the address of the party as mentioned in this Agreement. Any notice shall be deemed to have been received: (a) if delivered personally, at the time of delivery; (b) if sent by registered post or courier, on the date of delivery as evidenced by the delivery receipt; or (c) if sent by electronic mail, at the time of transmission if during normal business hours of the recipient, and if not, then on the next working day.'
  }
];

// Non-Disclosure Agreement Template for Indian jurisdiction
export const indianNDATemplate: ContractTemplate = {
  id: 'indian-nda',
  name: 'Indian Non-Disclosure Agreement',
  type: 'nda',
  description: 'Standard Non-Disclosure Agreement compliant with Indian contract law',
  jurisdiction: 'India',
  clauses: [
    {
      id: 'nda-definitions',
      title: 'Definitions',
      content: 'In this Agreement: "Confidential Information" means any information disclosed by one party (the "Disclosing Party") to the other party (the "Receiving Party"), either directly or indirectly, in writing, orally or by inspection of tangible objects, including but not limited to documents, business plans, financial analyses, market studies, know-how, designs, drawings, technical information, specifications, trade secrets, customer information, supplier information, and other proprietary information. Confidential Information shall not include information that: (i) is or becomes publicly known through no fault of the Receiving Party; (ii) is rightfully known by the Receiving Party without a restriction on disclosure prior to its receipt from the Disclosing Party; (iii) is independently developed by the Receiving Party without access to the Confidential Information; or (iv) is rightfully received by the Receiving Party from a third party without restriction on disclosure.'
    },
    {
      id: 'nda-obligations',
      title: 'Confidentiality Obligations',
      content: 'The Receiving Party shall maintain the confidentiality of the Confidential Information and shall not, without the prior written consent of the Disclosing Party, disclose any Confidential Information to any third party. The Receiving Party shall use the Confidential Information only for the purpose of [PURPOSE]. The Receiving Party shall take all reasonable measures to protect the secrecy of and avoid disclosure and unauthorized use of the Confidential Information, including at least those measures it takes to protect its own confidential information of a similar nature. The Receiving Party shall immediately notify the Disclosing Party in the event of any unauthorized use or disclosure of the Confidential Information.'
    },
    {
      id: 'nda-return',
      title: 'Return of Materials',
      content: 'Upon the termination of this Agreement or upon the Disclosing Party\'s request at any time, the Receiving Party shall promptly return to the Disclosing Party all copies, whether in written, electronic or other form or media, of the Disclosing Party\'s Confidential Information, or destroy all such copies and certify in writing to the Disclosing Party that such Confidential Information has been destroyed.'
    },
    {
      id: 'nda-term',
      title: 'Term and Termination',
      content: 'This Agreement shall commence on the Effective Date and shall remain in force for a period of [DURATION] years, unless earlier terminated by mutual written agreement of the parties. The confidentiality obligations under this Agreement shall survive the termination of this Agreement for a period of [SURVIVAL PERIOD] years.'
    },
    {
      id: 'nda-remedies',
      title: 'Remedies',
      content: 'The Receiving Party acknowledges that any breach or threatened breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages would be an inadequate remedy. Accordingly, in addition to any other remedies available at law or in equity, the Disclosing Party shall be entitled to seek injunctive relief to enforce the terms of this Agreement, without the necessity of proving actual damages or posting any bond or other security.'
    }
  ]
};

// Employment Contract Template for Indian jurisdiction
export const indianEmploymentTemplate: ContractTemplate = {
  id: 'indian-employment',
  name: 'Indian Employment Contract',
  type: 'employment',
  description: 'Comprehensive employment agreement following Indian labor laws',
  jurisdiction: 'India',
  clauses: [
    {
      id: 'employment-position',
      title: 'Position and Duties',
      content: 'The Employee shall be employed in the position of [POSITION] and shall report to [SUPERVISOR]. The Employee shall perform the duties and responsibilities as described in Schedule A attached hereto, and such other duties as may be reasonably assigned from time to time by the Employer. The Employee agrees to comply with all of the Employer\'s policies, procedures, rules and regulations in force from time to time.'
    },
    {
      id: 'employment-probation',
      title: 'Probation Period',
      content: 'The Employee shall be on probation for a period of [DURATION] months from the date of joining ("Probation Period"). During the Probation Period, either party may terminate this Agreement by giving [NOTICE PERIOD] days\' notice in writing to the other party or payment in lieu of notice. Upon successful completion of the Probation Period, the Employee shall be confirmed in the employment, subject to satisfactory performance.'
    },
    {
      id: 'employment-compensation',
      title: 'Compensation and Benefits',
      content: 'The Employee shall receive a gross annual salary of INR [AMOUNT] (Indian Rupees [AMOUNT IN WORDS]), payable in equal monthly installments on or before the [DAY] day of each month. The salary shall be subject to deduction of income tax at source and other statutory deductions as applicable under Indian law. The Employee shall be entitled to benefits as per the Employer\'s policies, including but not limited to provident fund, gratuity, health insurance, and leave entitlements as detailed in Schedule B attached hereto.'
    },
    {
      id: 'employment-working-hours',
      title: 'Working Hours and Leave',
      content: 'The normal working hours shall be from [START TIME] to [END TIME], [DAYS] per week, with a lunch break of [DURATION] minutes. The Employee may be required to work additional hours as necessary to fulfill the responsibilities of the position. The Employee shall be entitled to [NUMBER] days of paid annual leave, [NUMBER] days of sick leave, and other statutory leaves as per applicable Indian laws.'
    },
    {
      id: 'employment-confidentiality',
      title: 'Confidentiality and Intellectual Property',
      content: 'The Employee acknowledges that during the course of employment, the Employee may have access to confidential information relating to the Employer\'s business, clients, technical processes, or other matters. The Employee shall not, during the term of employment or at any time thereafter, use or disclose such confidential information to any person or entity without the prior written consent of the Employer. All intellectual property created by the Employee during the course of employment shall be the sole and exclusive property of the Employer.'
    },
    {
      id: 'employment-termination',
      title: 'Termination',
      content: 'After completion of the Probation Period, either party may terminate this Agreement by giving [NOTICE PERIOD] months\' notice in writing to the other party or payment in lieu of notice. The Employer may terminate this Agreement without notice or payment in lieu of notice in case of misconduct, fraud, dishonesty, or habitual neglect of duties by the Employee. Upon termination of employment, the Employee shall return all property belonging to the Employer and shall not retain any copies of documents or materials related to the Employer\'s business.'
    },
    {
      id: 'employment-restraint',
      title: 'Non-Compete and Non-Solicitation',
      content: 'During the term of employment and for a period of [DURATION] months following the termination of employment, the Employee shall not, directly or indirectly: (a) engage in any business competitive with the Employer\'s business; (b) solicit or entice away any customer or client of the Employer; or (c) solicit or entice away any employee of the Employer. This restraint shall be limited to [GEOGRAPHIC AREA].'
    }
  ]
};

// Consultant Agreement Template for Indian jurisdiction
export const indianConsultantTemplate: ContractTemplate = {
  id: 'indian-consultant',
  name: 'Indian Consultant Agreement',
  type: 'consulting',
  description: 'Independent contractor agreement for consultants in India',
  jurisdiction: 'India',
  clauses: [
    {
      id: 'consultant-services',
      title: 'Services',
      content: 'The Consultant shall provide the services described in Schedule A attached hereto (the "Services") to the Client. The Consultant shall perform the Services with due care, skill, and diligence, in accordance with the highest professional standards. The Consultant shall devote such time, attention, and skill to the performance of the Services as may be necessary to complete them to the satisfaction of the Client.'
    },
    {
      id: 'consultant-term',
      title: 'Term and Renewal',
      content: 'This Agreement shall commence on [START DATE] and shall continue for a period of [DURATION] months/years, unless earlier terminated in accordance with the provisions of this Agreement. This Agreement may be renewed for additional periods upon mutual written agreement of the parties at least [NOTICE PERIOD] days prior to the end of the then-current term.'
    },
    {
      id: 'consultant-fees',
      title: 'Fees and Payment',
      content: 'The Client shall pay the Consultant a fee of INR [AMOUNT] (Indian Rupees [AMOUNT IN WORDS]) for the Services ("Consultant Fee"). The Consultant Fee shall be payable as follows: [PAYMENT SCHEDULE]. The Consultant shall submit an invoice for the Fees and expenses (if applicable) at the end of each [PERIOD]. The Client shall pay the invoice within [PAYMENT TERM] days of receipt. All payments shall be subject to TDS (Tax Deducted at Source) as per applicable Indian tax laws.'
    },
    {
      id: 'consultant-expenses',
      title: 'Expenses',
      content: 'The Client shall reimburse the Consultant for all reasonable out-of-pocket expenses incurred by the Consultant in connection with the performance of the Services, provided that such expenses are pre-approved by the Client in writing and are supported by original receipts or other appropriate documentation.'
    },
    {
      id: 'consultant-relationship',
      title: 'Independent Contractor Relationship',
      content: 'The Consultant is an independent contractor and not an employee, agent, joint venturer, or partner of the Client. Nothing in this Agreement shall be interpreted or construed as creating or establishing an employment relationship between the Client and the Consultant. The Consultant shall be responsible for all tax liabilities arising from the compensation paid under this Agreement, including income tax and GST. The Consultant shall not be entitled to any benefits provided by the Client to its employees.'
    },
    {
      id: 'consultant-confidentiality',
      title: 'Confidentiality',
      content: 'The Consultant shall maintain the confidentiality of all information, documents, and materials provided by the Client or developed in the course of providing the Services ("Confidential Information"). The Consultant shall not disclose any Confidential Information to any third party without the prior written consent of the Client, except as required by law. The Consultant shall use the Confidential Information solely for the purpose of providing the Services. This confidentiality obligation shall survive the termination of this Agreement for a period of [DURATION] years.'
    },
    {
      id: 'consultant-intellectual-property',
      title: 'Intellectual Property',
      content: 'All intellectual property rights, including copyrights, patents, trade secrets, and trademarks, in any work, invention, development, discovery, improvement, or other intellectual property created by the Consultant in connection with the provision of the Services ("Work Product") shall be the sole and exclusive property of the Client. The Consultant hereby assigns to the Client all right, title, and interest in and to the Work Product. The Consultant shall execute all documents and take all actions necessary to perfect the Client\'s ownership of the Work Product.'
    },
    {
      id: 'consultant-termination',
      title: 'Termination',
      content: 'Either party may terminate this Agreement by giving [NOTICE PERIOD] days\' written notice to the other party. Either party may terminate this Agreement immediately upon written notice if the other party breaches any material provision of this Agreement and fails to cure such breach within [CURE PERIOD] days of receiving written notice thereof. Upon termination, the Consultant shall be entitled to payment for Services performed up to the date of termination, but shall not be entitled to any additional compensation or damages.'
    }
  ]
};

// Lease Agreement Template for Indian jurisdiction
export const indianLeaseTemplate: ContractTemplate = {
  id: 'indian-lease',
  name: 'Indian Lease Agreement',
  type: 'lease',
  description: 'Residential lease agreement compliant with Indian property laws',
  jurisdiction: 'India',
  clauses: [
    {
      id: 'lease-premises',
      title: 'Description of Premises',
      content: 'The Lessor hereby agrees to lease to the Lessee and the Lessee hereby agrees to take on lease from the Lessor, the premises bearing No. [PREMISES NUMBER], measuring approximately [AREA] square feet, situated at [COMPLETE ADDRESS] ("Premises"), together with the fixtures and fittings as listed in Schedule A attached hereto, for residential purposes only.'
    },
    {
      id: 'lease-term',
      title: 'Term and Renewal',
      content: 'The lease shall be for a period of [DURATION] months/years, commencing from [START DATE] and ending on [END DATE] ("Term"). Subject to the Lessee\'s compliance with the terms of this Agreement, the lease may be renewed for a further period as mutually agreed between the parties in writing at least [NOTICE PERIOD] months before the expiry of the Term. Any renewal shall be on such terms and conditions as may be mutually agreed between the parties, including revision of rent.'
    },
    {
      id: 'lease-rent',
      title: 'Rent and Deposit',
      content: 'The Lessee shall pay to the Lessor a monthly rent of INR [AMOUNT] (Indian Rupees [AMOUNT IN WORDS]) ("Rent"), payable in advance on or before the [DAY] day of each month. The Lessee shall deposit with the Lessor a refundable security deposit of INR [AMOUNT] (Indian Rupees [AMOUNT IN WORDS]) ("Security Deposit"), which shall be refunded to the Lessee at the time of vacating the Premises, after deducting any damages or outstanding dues.'
    },
    {
      id: 'lease-utilities',
      title: 'Utilities and Maintenance',
      content: 'The Lessee shall be responsible for payment of all utility charges including electricity, water, gas, telephone, internet, and cable TV charges. The Lessee shall maintain the Premises in good and tenantable condition, and shall be responsible for minor repairs up to a value of INR [AMOUNT]. All major repairs and structural changes shall be the responsibility of the Lessor. The Lessee shall allow the Lessor or the Lessor\'s representatives to enter the Premises for inspection or repairs after giving reasonable notice, except in case of emergency.'
    },
    {
      id: 'lease-restrictions',
      title: 'Restrictions on Use',
      content: 'The Lessee shall not: (a) use the Premises for any purpose other than residential purposes; (b) sublet, assign or part with possession of the Premises without the prior written consent of the Lessor; (c) make any structural alterations or additions to the Premises without the prior written consent of the Lessor; (d) cause or permit any nuisance or illegal activities on the Premises; or (e) keep any pets on the Premises without the prior written consent of the Lessor.'
    },
    {
      id: 'lease-termination',
      title: 'Termination',
      content: 'Either party may terminate this Agreement by giving [NOTICE PERIOD] months\' written notice to the other party. The Lessor may terminate this Agreement immediately if the Lessee: (a) fails to pay the Rent for [NUMBER] consecutive months; (b) breaches any material term of this Agreement and fails to remedy such breach within [PERIOD] days of receiving written notice; or (c) uses the Premises for any illegal or immoral purpose. Upon termination, the Lessee shall vacate the Premises and hand over peaceful possession to the Lessor.'
    },
    {
      id: 'lease-registration',
      title: 'Registration and Stamping',
      content: 'This Lease Agreement shall be registered with the appropriate Sub-Registrar of Assurances as per the provisions of the Registration Act, 1908. The stamp duty and registration charges shall be borne by the [PARTY] or shared equally between the Lessor and the Lessee.'
    }
  ]
};

// Partnership Agreement Template for Indian jurisdiction
export const indianPartnershipTemplate: ContractTemplate = {
  id: 'indian-partnership',
  name: 'Indian Partnership Deed',
  type: 'partnership',
  description: 'Partnership agreement following Indian Partnership Act',
  jurisdiction: 'India',
  clauses: [
    {
      id: 'partnership-formation',
      title: 'Formation and Name',
      content: 'The parties hereto agree to form a partnership under the name and style of [FIRM NAME] ("Firm") in accordance with the provisions of the Indian Partnership Act, 1932, on the terms and conditions set forth in this Deed. The partnership shall commence from [DATE] and shall continue until terminated as provided herein.'
    },
    {
      id: 'partnership-business',
      title: 'Business and Place of Business',
      content: 'The business of the Firm shall be [DESCRIPTION OF BUSINESS]. The principal place of business of the Firm shall be at [ADDRESS], or at such other place or places as the Partners may from time to time unanimously agree upon.'
    },
    {
      id: 'partnership-capital',
      title: 'Capital Contribution',
      content: 'The initial capital of the Firm shall be INR [AMOUNT] (Indian Rupees [AMOUNT IN WORDS]), which shall be contributed by the Partners in the following proportion: [PARTNER 1] - INR [AMOUNT] ([PERCENTAGE]%), [PARTNER 2] - INR [AMOUNT] ([PERCENTAGE]%), and so on. The capital accounts of the Partners shall be maintained in the books of accounts of the Firm. Each Partner may withdraw funds from the Firm up to the amount of his/her capital contribution with the consent of all other Partners.'
    },
    {
      id: 'partnership-profit-loss',
      title: 'Profit and Loss Sharing',
      content: 'The net profits and losses of the Firm shall be shared among the Partners in the following ratio: [PARTNER 1] - [PERCENTAGE]%, [PARTNER 2] - [PERCENTAGE]%, and so on. The net profits and losses shall be determined after deducting all expenses, salaries, interest on capital, and other relevant charges. The accounts of the Firm shall be maintained on a fiscal year basis from April 1 to March 31, and shall be audited annually by a Chartered Accountant appointed by the Partners.'
    },
    {
      id: 'partnership-management',
      title: 'Management and Decision Making',
      content: 'All Partners shall actively participate in the management and conduct of the Firm\'s business. Each Partner shall have equal rights in the management and conduct of the Firm\'s business. Decisions on ordinary matters shall be made by majority vote, with each Partner having one vote. Decisions on the following matters shall require the unanimous consent of all Partners: (a) change in the nature of the business; (b) admission of a new partner; (c) dissolution of the Firm; (d) expenditure exceeding INR [AMOUNT]; (e) borrowing exceeding INR [AMOUNT]; (f) disposing of any substantial asset of the Firm; and (g) any amendment to this Partnership Deed.'
    },
    {
      id: 'partnership-banking',
      title: 'Bank Accounts and Finances',
      content: 'The bank account(s) of the Firm shall be opened and maintained in the name of the Firm at such bank(s) as the Partners may from time to time decide. All withdrawals from the bank account(s) shall be made by cheques or electronic transfers signed/authorized by [SIGNING AUTHORITY]. The Partners shall maintain proper books of accounts, which shall be kept at the principal place of business of the Firm and shall be open for inspection by all Partners during normal business hours.'
    },
    {
      id: 'partnership-retirement',
      title: 'Retirement, Death, and Incapacity',
      content: 'Any Partner may retire from the Firm by giving at least [NOTICE PERIOD] months\' written notice to the other Partners. In the event of the retirement, death, or permanent incapacity of any Partner, the remaining Partners shall have the option to purchase the interest of the retiring, deceased, or incapacitated Partner at a price to be determined by a valuation of the Firm\'s assets and goodwill as at the date of such event. If the remaining Partners do not exercise this option within [PERIOD] days, the Firm shall be dissolved and wound up in accordance with the provisions of the Indian Partnership Act, 1932.'
    },
    {
      id: 'partnership-noncompete',
      title: 'Non-Competition',
      content: 'During the term of this Partnership and for a period of [DURATION] years after its termination, no Partner shall directly or indirectly engage in any business competitive with the business of the Firm within a radius of [DISTANCE] kilometers from the principal place of business of the Firm, without the prior written consent of all other Partners.'
    },
    {
      id: 'partnership-arbitration',
      title: 'Dispute Resolution',
      content: 'Any dispute arising between the Partners concerning the interpretation, application, or operation of this Partnership Deed shall be referred to a sole arbitrator to be appointed by the mutual consent of the Partners. The arbitration shall be conducted in accordance with the Arbitration and Conciliation Act, 1996. The decision of the arbitrator shall be final and binding on all Partners.'
    }
  ]
};

// Export all Indian templates
export const indianContractTemplates: ContractTemplate[] = [
  indianNDATemplate,
  indianEmploymentTemplate,
  indianConsultantTemplate,
  indianLeaseTemplate,
  indianPartnershipTemplate
];