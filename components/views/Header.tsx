import React from "react";
import Image from "next/image";
import { ComplianceBadge } from "../components/ComplianceBadge";
import { Settings } from "lucide-react";
import { Button } from "../elements/Button";

interface HeaderProps {
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
          <Image
            src="/icon.png"
            alt="limetax logo"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">limetaxIQ</h1>
          <p className="text-xs text-gray-500">
            KI-Assistent für Steuerkanzleien
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ComplianceBadge />
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="!p-2"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
