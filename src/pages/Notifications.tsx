import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bell } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationItem {
  id: string;
  icon: string;
  message: string;
  time: string;
  unread: boolean;
}

const Notifications = () => {
  const { isAuthenticated, requireAuth } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isAuthenticated) requireAuth(() => {}); }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.notifications) { setLoading(false); return; }
    apiGet<{ notifications: NotificationItem[] }>(cfg.api.notifications)
      .then((d) => setItems(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
          <Bell className="h-6 w-6" />Notifications
        </h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">You're all caught up!</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {items.map(n => (
              <Card key={n.id} className={n.unread ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="flex items-start gap-3 py-3">
                  <span className="text-xl">{n.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm ${n.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.time}</p>
                  </div>
                  {n.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
