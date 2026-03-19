import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import ProfileSetupModal from "./components/ProfileSetupModal";
import {
  InternetIdentityProvider,
  useInternetIdentity,
} from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import DiscussionsPage from "./pages/DiscussionsPage";
import ExplorePage from "./pages/ExplorePage";
import FeedPage from "./pages/FeedPage";
import KnowledgePage from "./pages/KnowledgePage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import RealTalksPage from "./pages/RealTalksPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30 },
  },
});

function AppLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const principalKey = identity
    ? `nexus_profile_done_${identity.getPrincipal().toString()}`
    : null;

  const [profileDoneLocally, setProfileDoneLocally] = useState(false);
  const [localCheckDone, setLocalCheckDone] = useState(false);

  useEffect(() => {
    if (!principalKey) {
      setProfileDoneLocally(false);
      setLocalCheckDone(false);
      return;
    }
    const done = localStorage.getItem(principalKey) === "true";
    setProfileDoneLocally(done);
    setLocalCheckDone(true);
  }, [principalKey]);

  useEffect(() => {
    if (profile && principalKey) {
      localStorage.setItem(principalKey, "true");
      setProfileDoneLocally(true);
    }
  }, [profile, principalKey]);

  const handleProfileSuccess = () => {
    if (principalKey) {
      localStorage.setItem(principalKey, "true");
    }
    setProfileDoneLocally(true);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  const showProfileSetup =
    !!identity &&
    !profileLoading &&
    isFetched &&
    profile === null &&
    localCheckDone &&
    !profileDoneLocally;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfileSetupModal
        open={showProfileSetup}
        onSuccess={handleProfileSuccess}
      />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Routes
const rootRoute = createRootRoute({ component: AppLayout });

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FeedPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const discussionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/discussions",
  component: DiscussionsPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const knowledgeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/knowledge",
  component: KnowledgePage,
});

const realTalksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/real-talks",
  component: RealTalksPage,
});

const routeTree = rootRoute.addChildren([
  discussionsRoute,
  feedRoute,
  messagesRoute,
  profileRoute,
  exploreRoute,
  knowledgeRoute,
  realTalksRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
