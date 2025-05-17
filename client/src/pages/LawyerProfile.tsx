import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';

// UI Components
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

// Icons
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Star,
  Check,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Calendar as CalendarIcon,
  Clock1,
  Award,
  Languages,
  GraduationCap,
  Sparkles,
  ThumbsUp,
  Globe,
  User,
  FileText,
  ChevronRight,
  Send,
  ShieldCheck as Shield
} from 'lucide-react';

// Layout
import DashboardLayout from '@/layouts/DashboardLayout';

// Mock review data
const mockReviews = [
  {
    id: 1,
    user: {
      name: "Vikram Singh",
      image: "https://randomuser.me/api/portraits/men/61.jpg",
    },
    rating: 5,
    date: "2 months ago",
    comment: "Priya provided excellent counsel during our startup's fundraising negotiations. Her expertise in structuring terms was instrumental in closing our Series A."
  },
  {
    id: 2,
    user: {
      name: "Anjali Gupta",
      image: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    rating: 4,
    date: "3 months ago",
    comment: "Very knowledgeable about startup equity structures. Quick to respond and thorough in her explanations. Would recommend her services."
  },
  {
    id: 3,
    user: {
      name: "Rajan Patel",
      image: "https://randomuser.me/api/portraits/men/42.jpg",
    },
    rating: 5,
    date: "4 months ago",
    comment: "Priya helped draft our shareholder agreement. Her attention to detail and understanding of potential future scenarios helped create a document that protects all parties."
  }
];

// Mock articles
const mockArticles = [
  {
    id: 1,
    title: "Understanding ESOP Pools for Indian Startups",
    date: "Jan 15, 2023",
    summary: "A guide to setting up employee stock ownership plans that benefit both founders and employees."
  },
  {
    id: 2,
    title: "Convertible Notes vs. SAFE: What's Right for Your Startup?",
    date: "Mar 22, 2023",
    summary: "Comparing funding instruments and their implications under Indian securities laws."
  },
  {
    id: 3,
    title: "Due Diligence Checklist for Startup Acquisitions",
    date: "Jun 10, 2023",
    summary: "Key aspects to verify when considering a startup purchase or preparing for acquisition."
  }
];

// Mock consultation timeslots
const generateTimeslots = () => {
  const timeslots = [];
  const today = new Date();
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    
    const daySlots = [];
    for (let hour = 10; hour <= 18; hour += 1) {
      // Skip lunch hour
      if (hour !== 13) {
        // Randomly decide if slot is available
        const isAvailable = Math.random() > 0.3;
        
        daySlots.push({
          time: `${hour}:00`,
          available: isAvailable,
        });
        
        // Add half-hour slots
        if (hour !== 18) {
          daySlots.push({
            time: `${hour}:30`,
            available: Math.random() > 0.3,
          });
        }
      }
    }
    
    timeslots.push({
      date: date.toISOString().split('T')[0],
      slots: daySlots,
    });
  }
  
  return timeslots;
};

interface BookingForm {
  date: Date | undefined;
  time: string;
  duration: string;
  mode: string;
  query: string;
  files: File[];
  lexiAIEnabled: boolean;
}

export default function LawyerProfile() {
  const params = useParams();
  const lawyerId = params.id;
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [timeSlots] = useState(generateTimeslots());
  const [chatInput, setChatInput] = useState('');
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    date: new Date(),
    time: '',
    duration: '30',
    mode: 'video',
    query: '',
    files: [],
    lexiAIEnabled: true,
  });
  
  // Mock data for now - in real app, fetch from API
  const { data: lawyer, isLoading } = useQuery({
    queryKey: [`/api/lawyers/${lawyerId}`],
    // In real implementation, this would make an API request
    queryFn: async () => {
      // This is just mock data for display purposes
      return {
        id: 1,
        name: "Priya Sharma",
        imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
        specialization: "Startup Law",
        location: { state: "Maharashtra", city: "Mumbai" },
        experience: 8,
        languages: ["English", "Hindi", "Marathi"],
        rating: 4.8,
        reviewCount: 56,
        hourlyRate: 2500,
        about: "Corporate lawyer with 8+ years of experience specializing in startup law. I help founders navigate fundraising, compliance, and growth challenges. Prior to my independent practice, I was Associate General Counsel at a leading venture capital firm where I oversaw 50+ investments across Series A to Series D rounds.",
        education: [
          { degree: "LLB", institution: "National Law School, Bangalore", year: "2015" },
          { degree: "LLM (Corporate Law)", institution: "Harvard Law School", year: "2017" }
        ],
        barCouncilId: "MAH/12345/2015",
        practiceAreas: ["Startup Law", "Venture Capital", "Corporate Law", "Contract Drafting"],
        verified: true,
        available: true,
        consultationModes: ["video", "call", "chat"],
        badges: ["Top Rated", "Quick Responder", "LexiCert Verified"],
        awards: [
          { title: "Rising Star in Corporate Law", organization: "Legal Excellence Awards", year: "2021" },
          { title: "40 Under 40 Legal Innovators", organization: "Legal Tech Association", year: "2022" }
        ],
        averageResponseTime: "2 hours",
        consultationStats: {
          completed: 68,
          ratings5star: 52
        }
      };
    },
    enabled: !!lawyerId,
    staleTime: Infinity, // For demo purposes
  });
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };
  
  // Render star rating
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half-star" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };
  
  const renderTimeSlots = () => {
    if (!selectedDate) return null;
    
    const dateString = selectedDate.toISOString().split('T')[0];
    const daySlots = timeSlots.find(day => day.date === dateString);
    
    if (!daySlots) return <p className="text-gray-500 text-center py-4">No slots available for this date</p>;
    
    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {daySlots.slots.map((slot, index) => (
          <Button
            key={index}
            variant={slot.available ? (bookingForm.time === slot.time ? "default" : "outline") : "ghost"}
            disabled={!slot.available}
            className={`h-10 ${!slot.available ? "opacity-50" : ""}`}
            onClick={() => setBookingForm({...bookingForm, time: slot.time})}
          >
            {slot.time}
          </Button>
        ))}
      </div>
    );
  };
  
  if (isLoading || !lawyer) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gray-200"></div>
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center space-x-2 pl-0 text-gray-600"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lawyers</span>
        </Button>
        
        {/* Lawyer profile header */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row">
            {/* Left side with photo and actions */}
            <div className="flex flex-col items-center mb-6 md:mb-0 md:mr-8">
              <div className="relative mb-4">
                <img 
                  src={lawyer.imageUrl} 
                  alt={lawyer.name}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-sm"
                />
                {lawyer.verified && (
                  <div className="absolute -right-2 bottom-2 bg-blue-500 rounded-full p-1.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
                <Button 
                  className="w-full"
                  onClick={() => setBookingModalOpen(true)}
                >
                  Book Consultation
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Ask a Question
                </Button>
              </div>
            </div>
            
            {/* Right side with lawyer details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">{lawyer.name}</h1>
                    {lawyer.badges.map((badge, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="ml-2 bg-primary-50 text-primary-700 border-primary-200"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-gray-600 text-lg mt-1">{lawyer.specialization}</p>
                  
                  <div className="flex items-center mt-2 space-x-1">
                    {renderStarRating(lawyer.rating)}
                    <span className="text-sm text-gray-500 ml-1">({lawyer.rating}) • {lawyer.reviewCount} reviews</span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center justify-end space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">Consultation Fee</p>
                      <p className="text-xl font-semibold text-gray-900">₹{lawyer.hourlyRate.toLocaleString()}/hour</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">{lawyer.location.city}, {lawyer.location.state}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium">{lawyer.experience} years</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                    <Languages className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Languages</p>
                    <p className="font-medium">{lawyer.languages.join(", ")}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Response Time</p>
                    <p className="font-medium">{lawyer.averageResponseTime}</p>
                  </div>
                </div>
              </div>
              
              {/* Consultation modes */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Available Consultation Modes</p>
                <div className="flex space-x-3">
                  {lawyer.consultationModes.includes('video') && (
                    <div className="bg-gray-50 rounded-full px-3 py-1 flex items-center space-x-1 text-sm">
                      <Video className="h-3.5 w-3.5 text-gray-600" />
                      <span>Video</span>
                    </div>
                  )}
                  
                  {lawyer.consultationModes.includes('call') && (
                    <div className="bg-gray-50 rounded-full px-3 py-1 flex items-center space-x-1 text-sm">
                      <Phone className="h-3.5 w-3.5 text-gray-600" />
                      <span>Call</span>
                    </div>
                  )}
                  
                  {lawyer.consultationModes.includes('chat') && (
                    <div className="bg-gray-50 rounded-full px-3 py-1 flex items-center space-x-1 text-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
                      <span>Chat</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bar verification ID */}
              <div className="mt-6 inline-flex items-center bg-blue-50 rounded px-3 py-1.5 border border-blue-100">
                <Check className="h-4 w-4 text-blue-600 mr-1.5" />
                <span className="text-sm text-blue-800">Bar Council ID: {lawyer.barCouncilId}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lawyer detailed profile tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-8">
                {/* About section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {lawyer.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{lawyer.about}</p>
                    
                    <div className="mt-6 space-y-6">
                      {/* Practice areas */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Areas of Practice</h3>
                        <div className="flex flex-wrap gap-2">
                          {lawyer.practiceAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="px-3 py-1">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Education */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Education</h3>
                        <div className="space-y-3">
                          {lawyer.education.map((edu, index) => (
                            <div key={index} className="flex items-start">
                              <GraduationCap className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                              <div>
                                <p className="font-medium">{edu.degree}</p>
                                <p className="text-sm text-gray-600">{edu.institution}, {edu.year}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Awards */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Awards & Recognition</h3>
                        <div className="space-y-3">
                          {lawyer.awards.map((award, index) => (
                            <div key={index} className="flex items-start">
                              <Award className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                              <div>
                                <p className="font-medium">{award.title}</p>
                                <p className="text-sm text-gray-600">{award.organization}, {award.year}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Analytics section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Consultation History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-gray-900">{lawyer.consultationStats.completed}</p>
                        <p className="text-sm text-gray-600">Consultations completed</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-gray-900">{lawyer.consultationStats.ratings5star}</p>
                        <p className="text-sm text-gray-600">5-star ratings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-6">
                {/* Reviews section */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Client Reviews</h3>
                    <div className="flex items-center space-x-2">
                      {renderStarRating(lawyer.rating)}
                      <span className="font-semibold">{lawyer.rating}</span>
                      <span className="text-gray-500">({lawyer.reviewCount} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {mockReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-start">
                          <img
                            src={review.user.image}
                            alt={review.user.name}
                            className="h-10 w-10 rounded-full mr-3 object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{review.user.name}</h4>
                              <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                            <div className="flex items-center mt-1 mb-2">
                              {Array(5).fill(0).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                            <div className="mt-3">
                              <Button variant="ghost" size="sm" className="h-8 px-3 text-gray-500 hover:text-primary-600">
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Helpful
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="articles" className="space-y-4">
                {/* Articles section */}
                {mockArticles.map((article) => (
                  <Card key={article.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{article.date}</p>
                        <p className="text-gray-700">{article.summary}</p>
                      </div>
                      <div className="bg-gray-50 px-6 py-3 flex justify-end">
                        <Button variant="link" className="text-primary-600 p-0 h-auto">
                          Read full article <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="faq" className="space-y-6">
                {/* FAQ section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">What types of startups do you typically work with?</h4>
                      <p className="text-gray-700">I work with startups across various sectors including SaaS, fintech, healthtech, and e-commerce. My experience spans from pre-seed startups to Series B companies, with a focus on tech-enabled businesses.</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Do you offer ongoing legal counsel or just one-time consultations?</h4>
                      <p className="text-gray-700">I offer both one-time consultations and ongoing counsel through flexible engagement models. Many startups begin with a specific issue and later transition to a monthly retainer for consistent legal support as they grow.</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">How do you charge for document review and drafting?</h4>
                      <p className="text-gray-700">For standard documents, I typically offer fixed fees based on complexity. For custom drafting or extensive revisions, I may charge hourly. I always provide a clear estimate before proceeding with any billable work.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Quick chat preview */}
            <Card>
              <CardHeader>
                <CardTitle>Ask a Quick Question</CardTitle>
                <CardDescription>Get a response typically within {lawyer.averageResponseTime}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 h-36 mb-4 overflow-y-auto">
                  <div className="flex items-start space-x-2 mb-3">
                    <div className="bg-primary-600 rounded-lg rounded-bl-none px-3 py-2 text-white text-sm max-w-[75%]">
                      <p>Hello! I'm Lexi AI. How can I assist you today?</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Textarea 
                    placeholder="Type your question here..." 
                    className="resize-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button 
                    className="flex-shrink-0" 
                    size="icon"
                    disabled={!chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">This will start a conversation with {lawyer.name}. Book a full consultation for in-depth advice.</p>
              </CardContent>
            </Card>
            
            {/* Quick availability */}
            <Card>
              <CardHeader>
                <CardTitle>Available Slots</CardTitle>
                <CardDescription>Book a consultation with {lawyer.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {/* Show next 3 days with available slots */}
                  {timeSlots.slice(0, 3).map((day, index) => {
                    const date = new Date(day.date);
                    const availableCount = day.slots.filter(slot => slot.available).length;
                    
                    return (
                      <Button 
                        key={index} 
                        variant="outline"
                        className="flex flex-col h-auto py-2"
                        onClick={() => setBookingModalOpen(true)}
                      >
                        <span className="text-xs text-gray-500">{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                        <span className="font-medium">{date.getDate()}</span>
                        <span className="text-xs mt-1">{availableCount} slots</span>
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setBookingModalOpen(true)}
                >
                  View Full Calendar
                </Button>
              </CardContent>
            </Card>
            
            {/* Verification badges */}
            <Card>
              <CardHeader>
                <CardTitle>Verifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Bar Council Verified</p>
                    <p className="text-xs text-gray-500">Credentials checked with Bar Council of India</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Identity Verified</p>
                    <p className="text-xs text-gray-500">Aadhaar and PAN verification complete</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">LexiScreen™ Verified</p>
                    <p className="text-xs text-gray-500">AI background and credential check</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Booking consultation modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Consultation with {lawyer.name}</DialogTitle>
            <DialogDescription>
              Choose your preferred date, time, and consultation mode
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left side - calendar and time selection */}
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="mx-auto"
                  disabled={(date) => {
                    // Disable past dates and dates more than 30 days in the future
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const thirtyDaysFromNow = new Date(today);
                    thirtyDaysFromNow.setDate(today.getDate() + 30);
                    return date < today || date > thirtyDaysFromNow;
                  }}
                />
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-3">Available Time Slots for {selectedDate && formatDate(selectedDate)}</h3>
                {renderTimeSlots()}
              </div>
            </div>
            
            {/* Right side - consultation options */}
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-3">Consultation Options</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Duration</label>
                    <Select
                      value={bookingForm.duration}
                      onValueChange={(value) => setBookingForm({...bookingForm, duration: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes (₹{(lawyer.hourlyRate/4).toLocaleString()})</SelectItem>
                        <SelectItem value="30">30 minutes (₹{(lawyer.hourlyRate/2).toLocaleString()})</SelectItem>
                        <SelectItem value="60">60 minutes (₹{lawyer.hourlyRate.toLocaleString()})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Consultation Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {lawyer.consultationModes.includes('video') && (
                        <Button 
                          variant={bookingForm.mode === 'video' ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => setBookingForm({...bookingForm, mode: 'video'})}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Video
                        </Button>
                      )}
                      
                      {lawyer.consultationModes.includes('call') && (
                        <Button 
                          variant={bookingForm.mode === 'call' ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => setBookingForm({...bookingForm, mode: 'call'})}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                      
                      {lawyer.consultationModes.includes('chat') && (
                        <Button 
                          variant={bookingForm.mode === 'chat' ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => setBookingForm({...bookingForm, mode: 'chat'})}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Describe your legal issue</label>
                    <Textarea 
                      placeholder="Briefly explain your legal matter..."
                      value={bookingForm.query}
                      onChange={(e) => setBookingForm({...bookingForm, query: e.target.value})}
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-primary-50 rounded-lg p-3 border border-primary-100">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-primary-500" />
                      <div>
                        <p className="font-medium text-primary-700">Enable Lexi AI Assistant</p>
                        <p className="text-xs text-primary-600">AI will transcribe and suggest solutions during call</p>
                      </div>
                    </div>
                    <div className="flex items-center h-6">
                      <input
                        type="checkbox"
                        id="lexi-ai"
                        checked={bookingForm.lexiAIEnabled}
                        onChange={(e) => setBookingForm({...bookingForm, lexiAIEnabled: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-medium mb-3">Consultation Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {selectedDate && formatDate(selectedDate)}, {bookingForm.time || 'Select a time'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{bookingForm.duration} minutes</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-medium capitalize">{bookingForm.mode}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consultation Fee:</span>
                    <span className="font-medium">
                      ₹{(parseInt(bookingForm.duration) / 60 * lawyer.hourlyRate).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="font-medium">₹200</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lexi AI Assistant:</span>
                    <span className="font-medium">{bookingForm.lexiAIEnabled ? '₹300' : 'Not enabled'}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">
                      ₹{(
                        (parseInt(bookingForm.duration) / 60 * lawyer.hourlyRate) + 
                        200 + 
                        (bookingForm.lexiAIEnabled ? 300 : 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              disabled={!selectedDate || !bookingForm.time || !bookingForm.mode}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}