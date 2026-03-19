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
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Edit, LogOut, Search, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllUsers, useGetCallerUserProfile } from "../hooks/useQueries";
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
  const { data: allUsers } = useGetAllUsers();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentPrincipal = identity?.getPrincipal().toString();

  const filteredUsers = (allUsers ?? [])
    .filter(([principal, prof]) => {
      if (principal.toString() === currentPrincipal) return false;
      const q = searchValue.toLowerCase();
      return (
        prof.displayName.toLowerCase().includes(q) ||
        prof.bio.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setShowResults(false);
      setSearchValue("");
    }
  }

  function handleUserClick() {
    navigate({ to: "/explore" });
    setSearchValue("");
    setShowResults(false);
  }

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

  const showDropdown = showResults && searchValue.trim().length > 0;

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
        <div
          className="flex-1 max-w-xs hidden lg:block"
          ref={searchContainerRef}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search Nexus…"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={handleKeyDown}
              className="pl-9 h-8 rounded-full text-sm bg-accent border-transparent focus:border-border"
              data-ocid="header.search_input"
            />

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                data-ocid="header.popover"
              >
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Koi user nahi mila</span>
                  </div>
                ) : (
                  <ul>
                    {filteredUsers.map(([principal, prof], idx) => {
                      const userAvatar = prof.avatarBlob?.getDirectURL();
                      const name =
                        prof.displayName ||
                        shortPrincipal(principal.toString());
                      return (
                        <li key={principal.toString()}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                            onClick={handleUserClick}
                            data-ocid={`search.item.${idx + 1}`}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              {userAvatar && (
                                <AvatarImage src={userAvatar} alt={name} />
                              )}
                              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate text-foreground">
                                {name}
                              </p>
                              {prof.bio && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {prof.bio}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
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
