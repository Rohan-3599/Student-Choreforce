import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function UserNav() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const initials = ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase();
  const isTasker = location === "/tasker";

  return (
    <NavigationMenu className="z-50">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-10 w-10 rounded-full p-0 bg-transparent border-2 border-primary/20 hover:border-primary transition-all overflow-hidden after:hidden">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profileImageUrl ?? undefined} alt={user.firstName ?? ""} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="md:w-64">
            <div className="w-64 border-2 border-primary/30 bg-background shadow-2xl rounded-lg overflow-hidden ring-0">
              <div className="p-4 bg-primary text-primary-foreground border-b border-primary/20">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold leading-none">{user.firstName} {user.lastName}</p>
                    {user.isTaskerVerified && <ShieldCheck className="w-3.5 h-3.5 text-secondary fill-secondary/20" />}
                  </div>
                  <p className="text-[11px] leading-none text-primary-foreground/80 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="p-1.5 space-y-0.5">
                <Link href={`/profile${isTasker || user.isTaskerVerified ? "?tab=tasker" : "?tab=requester"}`}>
                  <NavigationMenuLink className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold text-muted-foreground hover:text-primary hover:bg-secondary/10 transition-colors cursor-pointer group">
                    <Settings className="h-4 w-4 group-hover:text-primary transition-colors" />
                    <span>Profile Settings</span>
                  </NavigationMenuLink>
                </Link>

                <div className="h-px bg-border/50 my-1 mx-2" />

                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors cursor-pointer group"
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
