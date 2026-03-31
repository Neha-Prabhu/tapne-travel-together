import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trip, TripApplication, ApplicationQuestion } from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Eye, Users, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface ApplicationManagerProps {
  trip: Trip;
}

// Mock applications for demo
const getMockApplications = (tripId: string): TripApplication[] => {
  if (tripId === "t2") {
    return [
      {
        id: "app1", tripId: "t2", userId: "u4",
        userName: "Ananya Desai", userAvatar: "https://i.pravatar.cc/150?img=9",
        userEmail: "ananya@email.com", userPhone: "+91 9876543210", userAge: "27", userGender: "Female",
        answers: { q1: "I've been wanting to do this trek for 2 years. I'm physically active and run 5k every day.", q2: "Yes, I did the Kedarkantha trek last winter." },
        status: "pending", submittedAt: "2026-03-15T10:30:00Z",
      },
      {
        id: "app2", tripId: "t2", userId: "u6",
        userName: "Meera Nair", userAvatar: "https://i.pravatar.cc/150?img=20",
        userEmail: "meera@email.com", userPhone: "+91 8765432109", userAge: "25", userGender: "Female",
        answers: { q1: "Love mountains and have been trekking since I was 15.", q2: "Multiple treks in Western Ghats and one Himalayan trek." },
        status: "approved", submittedAt: "2026-03-12T14:00:00Z",
      },
    ];
  }
  if (tripId === "t6") {
    return [
      {
        id: "app3", tripId: "t6", userId: "u2",
        userName: "Priya Sharma", userAvatar: "https://i.pravatar.cc/150?img=5",
        userEmail: "priya@email.com", userPhone: "+91 7654321098", userAge: "29", userGender: "Female",
        answers: { q1: "Ladakh has been on my bucket list forever! I ride a Royal Enfield.", q2: "No" },
        status: "pending", submittedAt: "2026-03-20T09:00:00Z",
      },
    ];
  }
  return [];
};

const ApplicationManager = ({ trip }: ApplicationManagerProps) => {
  const [applications, setApplications] = useState<TripApplication[]>(() => getMockApplications(trip.id));
  const [viewingApp, setViewingApp] = useState<TripApplication | null>(null);
  const questions = trip.applicationConfig?.customQuestions || [];

  const handleApprove = (appId: string) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "approved" as const } : a));
    toast.success("Application approved! Traveler has been notified.");
  };

  const handleReject = (appId: string) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "rejected" as const } : a));
    toast.info("Application rejected.");
  };

  const pending = applications.filter(a => a.status === "pending");
  const approved = applications.filter(a => a.status === "approved");
  const rejected = applications.filter(a => a.status === "rejected");

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Applications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No applications yet</p>
            <p className="text-xs">Applications will appear here when travelers apply</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">Applications</CardTitle>
            </div>
            <div className="flex gap-1.5">
              {pending.length > 0 && <Badge variant="secondary" className="text-xs">{pending.length} pending</Badge>}
              {approved.length > 0 && <Badge className="text-xs bg-primary/10 text-primary border-0">{approved.length} approved</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.map(app => (
            <div
              key={app.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                app.status === "pending" ? "border-border" : app.status === "approved" ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={app.userAvatar} />
                <AvatarFallback>{app.userName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{app.userName}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] h-5",
                      app.status === "pending" ? "text-amber-600 border-amber-300" :
                      app.status === "approved" ? "text-primary border-primary/30" :
                      "text-destructive border-destructive/30"
                    )}
                  >
                    {app.status === "pending" && <Clock className="mr-0.5 h-3 w-3" />}
                    {app.status === "approved" && <CheckCircle2 className="mr-0.5 h-3 w-3" />}
                    {app.status === "rejected" && <XCircle className="mr-0.5 h-3 w-3" />}
                    {app.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Applied {format(new Date(app.submittedAt), "MMM d, yyyy")}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingApp(app)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {app.status === "pending" && (
                  <>
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleApprove(app.id)}>Approve</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleReject(app.id)}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={!!viewingApp} onOpenChange={() => setViewingApp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {viewingApp && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={viewingApp.userAvatar} />
                  <AvatarFallback>{viewingApp.userName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{viewingApp.userName}</p>
                  <p className="text-xs text-muted-foreground">{viewingApp.userEmail}</p>
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{viewingApp.userPhone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{viewingApp.userAge}</span></div>
                {viewingApp.userGender && <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="capitalize">{viewingApp.userGender}</span></div>}
              </div>
              {Object.keys(viewingApp.answers).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Answers</p>
                  {Object.entries(viewingApp.answers).map(([qId, answer]) => {
                    const q = questions.find(q => q.id === qId);
                    return (
                      <div key={qId} className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground mb-1">{q?.question || `Question ${qId}`}</p>
                        <p className="text-sm">{Array.isArray(answer) ? answer.join(", ") : answer}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {viewingApp.status === "pending" && (
                <div className="flex gap-2">
                  <Button onClick={() => { handleApprove(viewingApp.id); setViewingApp(null); }} className="flex-1">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => { handleReject(viewingApp.id); setViewingApp(null); }} className="flex-1">
                    <XCircle className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApplicationManager;
