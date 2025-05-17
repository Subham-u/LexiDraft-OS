import { Link, useLocation } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/contracts", label: "Contracts", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { path: "/lexi-ai", label: "Lexi AI", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { path: "/clients", label: "Clients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-gray-200 bg-white p-2 md:hidden">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path} 
          className="flex flex-col items-center px-3 py-2"
        >
          <svg 
            className={`h-6 w-6 ${location === item.path ? "text-primary-600" : "text-gray-500"}`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
          </svg>
          <span className={`mt-1 text-xs ${location === item.path ? "text-primary-700" : "text-gray-500"}`}>
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
