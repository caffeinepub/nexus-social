import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Edit, LogOut, Search, User } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { getInitials } from "../utils/format";
import NotificationsDropdown from "./NotificationsDropdown";

const NAV_LINKS = [
  { label: "Feed", to: "/" },
  { label: "Messages", to: "/messages" },
  { label: "Communities", to: "/explore" },
  { label: "Profile", to: "/profile" },
  { label: "Explore", to: "/explore" },
];

interface Props {
  onCompose?: () => void;
}

export default function Header({ onCompose }: Props) {
  const { identity, clear } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [searchValue, setSearchValue] = useState("");

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const avatarUrl = profile?.avatarBlob?.getDirectURL();
  const displayName =
    profile?.displayName ||
    shortPrincipal(identity?.getPrincipal().toString() || "");

  function shortPrincipal(p: string) {
    if (!p || p.length <= 10) return p;
    return `${p.slice(0, 5)}...${p.slice(-4)}`;
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 mr-2"
          data-ocid="header.link"
        >
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          <span className="text-base font-bold text-foreground hidden sm:block">
            Nexus
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, to }) => {
            const isActive =
              label === "Feed"
                ? currentPath === "/"
                : currentPath.startsWith(to) && to !== "/";
            return (
              <Link
                key={label}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                data-ocid={`nav.${label.toLowerCase()}.link`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search Nexus…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 h-8 rounded-full text-sm bg-accent border-transparent focus:border-border"
              data-ocid="header.search_input"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-ocid="header.toggle"
              >
                <Avatar className="h-8 w-8">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  )}
                  <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold truncate">{displayName}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" data-ocid="header.profile.link">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
                data-ocid="header.logout.button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create button */}
          <Button
            size="sm"
            className="rounded-full h-8 px-4 text-xs font-semibold ml-1"
            onClick={onCompose}
            data-ocid="header.primary_button"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Create
          </Button>
        </div>
      </div>
    </header>
  );
}
