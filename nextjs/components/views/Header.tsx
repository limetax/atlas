"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ComplianceBadge } from "../components/ComplianceBadge";
import { UserMenu } from "../components/UserMenu";
import { Settings } from "lucide-react";
import { Button } from "../elements/Button";
import { getAuthService } from "@/lib/services/auth.service";
import type { User } from "@supabase/supabase-js";
import type { Advisor } from "@/types/database";

interface HeaderProps {
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  const [user, setUser] = useState<User | null>(null);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authService = getAuthService();

    // Initial fetch
    const fetchUserData = async () => {
      const currentUser = await authService.getUser();
      setUser(currentUser);

      if (currentUser) {
        const advisorData = await authService.getAdvisor();
        setAdvisor(advisorData);
      }

      setIsLoading(false);
    };

    fetchUserData();

    // Subscribe to auth changes
    const subscription = authService.onAuthStateChange(async (newUser) => {
      setUser(newUser);
      if (newUser) {
        const advisorData = await authService.getAdvisor();
        setAdvisor(advisorData);
      } else {
        setAdvisor(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

        {/* User menu - only show when loaded and user exists */}
        {!isLoading && user && <UserMenu user={user} advisor={advisor} />}
      </div>
    </header>
  );
};
