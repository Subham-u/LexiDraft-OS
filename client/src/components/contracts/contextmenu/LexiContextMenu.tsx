import React from 'react';
import { Wand2, MessageSquare, Pen, Book, Bold, Search, Check, TextQuote, FileText, AlertCircle, PanelRightOpen } from 'lucide-react';

interface LexiContextMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, text: string) => void;
  isVisible: boolean;
}

export default function LexiContextMenu({
  selectedText,
  position,
  onClose,
  onAction,
  isVisible
}: LexiContextMenuProps) {
  if (!isVisible) return null;

  const menuActions = [
    {
      id: 'explain',
      label: 'Explain this clause',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      description: 'Get a simple explanation of what this legal clause means'
    },
    {
      id: 'simplify',
      label: 'Simplify',
      icon: <Book className="h-4 w-4 mr-2" />,
      description: 'Make this clause easier to understand'
    },
    {
      id: 'strengthen',
      label: 'Strengthen',
      icon: <Bold className="h-4 w-4 mr-2" />,
      description: 'Make this clause more protective'
    },
    {
      id: 'improve',
      label: 'Improve wording',
      icon: <Pen className="h-4 w-4 mr-2" />,
      description: 'Enhance the language of this clause'
    },
    {
      id: 'validateIndian',
      label: 'Verify per Indian law',
      icon: <Check className="h-4 w-4 mr-2" />,
      description: 'Check compliance with Indian legal standards'
    },
    {
      id: 'findRisks',
      label: 'Find risks',
      icon: <AlertCircle className="h-4 w-4 mr-2" />,
      description: 'Identify potential legal risks'
    },
    {
      id: 'suggestAdditions',
      label: 'Suggest additions',
      icon: <TextQuote className="h-4 w-4 mr-2" />,
      description: 'Recommend additional language or clauses'
    },
    {
      id: 'citeLaw',
      label: 'Cite relevant law',
      icon: <FileText className="h-4 w-4 mr-2" />,
      description: 'Add citations to relevant Indian laws'
    },
    {
      id: 'analyze',
      label: 'Detailed analysis',
      icon: <Search className="h-4 w-4 mr-2" />,
      description: 'Get a comprehensive legal analysis'
    },
    {
      id: 'sidebarView',
      label: 'Open in sidebar',
      icon: <PanelRightOpen className="h-4 w-4 mr-2" />,
      description: 'Analyze in the Lexi sidebar'
    }
  ];

  // Close the menu if clicked outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.lexi-context-menu') === null) {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleGlobalClick = () => onClose();
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [onClose]);

  return (
    <div
      className="lexi-context-menu absolute z-50 bg-white shadow-lg rounded-md border border-gray-200 p-1 w-64"
      style={{
        top: position.y,
        left: position.x,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1.5 text-sm font-medium text-primary border-b border-gray-100">
        <div className="flex items-center">
          <Wand2 className="h-4 w-4 mr-2" />
          <span>Lexi AI Assistant</span>
        </div>
      </div>
      
      <div className="py-1">
        {menuActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id, selectedText)}
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex flex-col"
          >
            <div className="flex items-center">
              {action.icon}
              <span>{action.label}</span>
            </div>
            <span className="text-xs text-gray-500 ml-6">{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}