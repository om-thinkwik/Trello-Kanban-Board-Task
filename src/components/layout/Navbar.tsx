import { Bell, Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function Navbar() {

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-hairline bg-white px-6 shadow-sm">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search projects, tasks..." className="pl-9 bg-gray-50 border-transparent focus:bg-white focus:border-gray-300" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors">
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 cursor-pointer">
          <UserCircle className="h-6 w-6" />
        </div>
      </div>
    </header>
  );
}
