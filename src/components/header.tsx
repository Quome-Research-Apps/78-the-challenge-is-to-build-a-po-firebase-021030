"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  isDataLoaded: boolean;
}

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-primary"
  >
    <path d="M3 3v18h18" />
    <path d="M7 12v5" />
    <path d="M12 7v10" />
    <path d="M17 4v13" />
  </svg>
);


export function Header({ onReset, isDataLoaded }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-3">
        <Logo />
        <h1 className="text-xl font-bold tracking-tight text-foreground font-headline">
          Civic Insights
        </h1>
      </div>
      {isDataLoaded && (
        <Button variant="outline" size="sm" onClick={onReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Upload New Data
        </Button>
      )}
    </header>
  );
}
