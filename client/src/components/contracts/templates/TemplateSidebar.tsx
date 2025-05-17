import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Search, HelpCircle, Sparkles, Shield } from 'lucide-react';
import { Clause } from '@shared/schema';

// Define template type
interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  jurisdiction: string;
  content?: string;
}

interface TemplateSidebarProps {
  onSelectTemplate: (template: ContractTemplate) => void;
  onAddClause: (clause: Clause) => void;
  onAIAction: (action: string) => void;
  contractType?: string;
}

export default function TemplateSidebar({ 
  onSelectTemplate, 
  onAddClause, 
  onAIAction,
  contractType = 'standard'
}: TemplateSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  
  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery<ContractTemplate[]>({
    queryKey: ['/api/templates'],
    queryFn: getQueryFn(),
    initialData: [],
  });
  
  // Fetch clauses library
  const { data: clauses, isLoading: clausesLoading } = useQuery<Clause[]>({
    queryKey: ['/api/clauses'],
    queryFn: getQueryFn(),
    initialData: [],
  });
  
  // Filtering based on search term
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredClauses = clauses.filter(clause => 
    clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clause.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Indian contract template suggestions based on contract type
  const getIndianTemplatesSuggestions = () => {
    return [
      { 
        id: 'indian-nda', 
        name: 'Indian NDA Template', 
        type: 'nda',
        description: 'Standard Non-Disclosure Agreement compliant with Indian contract law',
        jurisdiction: 'India'
      },
      { 
        id: 'indian-employment', 
        name: 'Indian Employment Contract', 
        type: 'employment',
        description: 'Comprehensive employment agreement following Indian labor laws',
        jurisdiction: 'India'
      },
      { 
        id: 'indian-consultant', 
        name: 'Indian Consultant Agreement', 
        type: 'consulting',
        description: 'Independent contractor agreement for consultants in India',
        jurisdiction: 'India'
      },
      { 
        id: 'indian-lease', 
        name: 'Indian Lease Agreement', 
        type: 'lease',
        description: 'Residential lease agreement compliant with Indian property laws',
        jurisdiction: 'India'
      },
      { 
        id: 'indian-partnership', 
        name: 'Indian Partnership Deed', 
        type: 'partnership',
        description: 'Partnership agreement following Indian Partnership Act',
        jurisdiction: 'India'
      }
    ].filter(template => !contractType || template.type === contractType);
  };
  
  // Standard clauses for Indian contracts
  const getCommonIndianClauses = () => {
    return [
      { 
        id: 'indian-arbitration', 
        title: 'Indian Arbitration Clause', 
        content: 'Any dispute arising out of or in connection with this contract shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India.'
      },
      { 
        id: 'indian-governing-law', 
        title: 'Governing Law (India)', 
        content: 'This Agreement shall be governed by and construed in accordance with the laws of India, without giving effect to any choice of law or conflict of law provisions.'
      },
      { 
        id: 'indian-force-majeure', 
        title: 'Force Majeure (Indian Context)', 
        content: 'Neither party shall be liable for any failure to perform its obligations under this Agreement if such failure results from circumstances beyond that party\'s reasonable control, including but not limited to acts of God, natural disasters, pandemic, epidemic, war, civil disorder, or other similar events.'
      },
      { 
        id: 'indian-stamp-duty', 
        title: 'Stamp Duty Compliance', 
        content: 'The parties agree that this Agreement shall be properly stamped in accordance with the applicable Stamp Act in the relevant state of India where this Agreement is executed.'
      },
      { 
        id: 'indian-jurisdiction', 
        title: 'Jurisdiction Clause', 
        content: 'The courts at [City Name], India shall have exclusive jurisdiction over any disputes arising under this Agreement.'
      },
      { 
        id: 'indian-gst', 
        title: 'GST Compliance', 
        content: 'All payments under this Agreement are exclusive of Goods and Services Tax (GST) which shall be payable by the appropriate party as per applicable laws.'
      }
    ];
  };
  
  // Define fallback items
  const indianTemplates = getIndianTemplatesSuggestions();
  const commonIndianClauses = getCommonIndianClauses();
  
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold">Contract Tools</h3>
        <div className="mt-2">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-60px)]">
        <TabsList className="grid grid-cols-3 p-0 bg-gray-100">
          <TabsTrigger value="templates" className="py-2">
            Templates
          </TabsTrigger>
          <TabsTrigger value="clauses" className="py-2">
            Clauses
          </TabsTrigger>
          <TabsTrigger value="ai" className="py-2">
            Lexi AI
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {searchTerm === '' && (
                <>
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">INDIAN LAW TEMPLATES</h4>
                    <div className="space-y-2">
                      {indianTemplates.map(template => (
                        <div
                          key={template.id}
                          className="p-3 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => onSelectTemplate(template)}
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                </>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-2">
                  {searchTerm ? 'SEARCH RESULTS' : 'ALL TEMPLATES'}
                </h4>
                <div className="space-y-2">
                  {templatesLoading ? (
                    <div className="py-2 text-sm text-gray-500">Loading templates...</div>
                  ) : filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-3 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onSelectTemplate(template)}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-sm text-gray-500">
                      {searchTerm ? 'No templates found matching your search.' : 'No templates available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="clauses" className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {searchTerm === '' && (
                <>
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">COMMON INDIAN CLAUSES</h4>
                    <div className="space-y-2">
                      {commonIndianClauses.map(clause => (
                        <div
                          key={clause.id}
                          className="p-3 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => onAddClause(clause)}
                        >
                          <div className="font-medium">{clause.title}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {clause.content.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                </>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-2">
                  {searchTerm ? 'SEARCH RESULTS' : 'SAVED CLAUSES'}
                </h4>
                <div className="space-y-2">
                  {clausesLoading ? (
                    <div className="py-2 text-sm text-gray-500">Loading clauses...</div>
                  ) : filteredClauses.length > 0 ? (
                    filteredClauses.map(clause => (
                      <div
                        key={clause.id}
                        className="p-3 rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onAddClause(clause)}
                      >
                        <div className="font-medium">{clause.title}</div>
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {clause.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-sm text-gray-500">
                      {searchTerm ? 'No clauses found matching your search.' : 'No saved clauses available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="ai" className="p-0 h-full">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">LEXI AI ACTIONS</h4>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => onAIAction('analyze')}
                >
                  <HelpCircle className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Analyze Contract</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => onAIAction('suggest')}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Suggest Improvements</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => onAIAction('compliance')}
                >
                  <Shield className="mr-2 h-4 w-4 text-green-500" />
                  <span>Check Indian Law Compliance</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => onAIAction('generate')}
                >
                  <FileText className="mr-2 h-4 w-4 text-purple-500" />
                  <span>Generate New Clause</span>
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">CUSTOMIZE LEXI</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clause Generation Style</label>
                  <Select defaultValue="balanced">
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly & Accessible</SelectItem>
                      <SelectItem value="balanced">Balanced & Professional</SelectItem>
                      <SelectItem value="strict">Strict & Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jurisdiction</label>
                  <Select defaultValue="india">
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}