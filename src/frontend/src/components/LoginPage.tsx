import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-card border border-border rounded-2xl p-8 shadow-card text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                N
              </span>
            </div>
            <span className="text-2xl font-bold text-foreground">Nexus</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to Nexus
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Connect, share, and discover with your community.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Users, label: "Connect" },
              { icon: MessageCircle, label: "Discuss" },
              { icon: Zap, label: "Discover" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
            className="w-full rounded-full h-11 text-sm font-semibold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in to Nexus"
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Secure, decentralized identity — no password needed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
