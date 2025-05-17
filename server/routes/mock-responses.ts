/**
 * Mock response data for development and testing
 * These will be replaced with real data from services as they are implemented
 */

/**
 * Mock contract analysis data
 */
export const mockContractAnalysis = {
  success: true,
  riskScore: 40,
  completeness: 78,
  issues: 3,
  strengths: [
    "Clear payment terms", 
    "Well-defined scope of work",
    "Includes termination provisions"
  ],
  weaknesses: [
    "Missing dispute resolution clause", 
    "Vague intellectual property terms",
    "No confidentiality provisions"
  ],
  recommendations: [
    "Add a dispute resolution clause that specifies mediation/arbitration",
    "Clearly define intellectual property ownership and usage rights",
    "Include confidentiality provisions to protect sensitive information"
  ],
  compliantWithIndianLaw: true
};

/**
 * Mock notifications data
 */
export const mockNotifications = {
  success: true,
  data: [
    {
      id: 1,
      userId: 1,
      title: "Contract Review Complete",
      message: "Your employment contract has been analyzed and is ready for review.",
      type: "info",
      link: "/contracts/1",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 minutes ago
    },
    {
      id: 2,
      userId: 1,
      title: "New Message",
      message: "You have a new message from Advocate Sharma regarding your contract.",
      type: "message",
      link: "/chat/1",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: 3,
      userId: 1,
      title: "Contract Modified",
      message: "Your NDA contract was modified by John Doe.",
      type: "warning",
      link: "/contracts/2",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    }
  ],
  unreadCount: 2
};

/**
 * Mock unread notification count
 */
export const mockUnreadCount = {
  success: true,
  data: { count: 2 }
};

/**
 * Mock chat rooms data
 */
export const mockChatRooms = {
  success: true,
  data: [
    {
      id: 1,
      name: "Advocate Sharma",
      type: "direct",
      participants: [1, 2],
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      metadata: { unreadCount: 2 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: 2,
      name: "Contract Review Team",
      type: "group",
      participants: [1, 3, 4],
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      metadata: { unreadCount: 0 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    }
  ]
};

/**
 * Mock chat messages data
 */
export const mockChatMessages = {
  success: true,
  data: [
    {
      id: 1,
      chatRoomId: 1,
      senderId: 2,
      content: "Hello, I've reviewed your contract and have some suggestions.",
      type: "text",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() // 35 minutes ago
    },
    {
      id: 2,
      chatRoomId: 1,
      senderId: 1,
      content: "Thank you! What are your main concerns?",
      type: "text",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 33).toISOString() // 33 minutes ago
    },
    {
      id: 3,
      chatRoomId: 1,
      senderId: 2,
      content: "The intellectual property clause needs to be more specific about ownership rights.",
      type: "text",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    }
  ]
};