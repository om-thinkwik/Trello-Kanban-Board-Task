"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="rounded-full bg-primary-accent/10 p-6 mb-6">
        <Ghost className="h-16 w-16 text-primary-accent animate-bounce" />
      </div>
      
      <h1 className="mb-2 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 font-heading">
        404 - Page Not Found
      </h1>
      
      <p className="mb-8 max-w-md text-lg text-gray-500 font-medium leading-relaxed">
        Oops! It seems like you've wandered into an unknown territory. The board or project you're looking for doesn't exist.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className="w-full sm:w-auto h-11 px-8 text-base shadow-sm">
            <Home className="mr-2 h-4 w-4" /> Go back Home
          </Button>
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-8 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
