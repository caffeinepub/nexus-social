import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { SiGithub, SiX } from "react-icons/si";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: ["Features", "Communities", "Messages", "Explore"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Support",
    links: ["Help Center", "Privacy", "Terms", "Contact"],
  },
];

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Brand */}
          <div className="md:w-48 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  N
                </span>
              </div>
              <span className="font-bold text-foreground">Nexus</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The community platform built for real connection.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                  {col.title}
                </h4>
                <ul className="space-y-1.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3 shrink-0">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Follow us
            </h4>
            <div className="flex gap-3">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <SiX size={16} />
              </span>
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <SiGithub size={16} />
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            &copy; {year}. Built with &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>

          {/* Theme toggle */}
          <div className="flex items-center gap-2">
            <Label
              htmlFor="theme-toggle"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {isDark ? "Dark" : "Light"}
            </Label>
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              data-ocid="footer.toggle"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
