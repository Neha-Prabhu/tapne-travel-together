import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiGet, apiPost } from "@/lib/api";
import type { EnrollmentRequestData, HostingInboxResponse } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Eye, ClipboardList, Loader2 } from "lucide-react";

interface ApplicationManagerProps {
  tripId: number;
}

const ApplicationManager = ({ tripId }: ApplicationManagerProps) => {
  const [requests, setRequests] = useState<EnrollmentRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReq, setViewingReq] = useState<EnrollmentRequestData | null>(null);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, denied: 0 });

  const fetchRequests = () => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.hosting_inbox) { setLoading(false); return; }
    apiGet<HostingInboxResponse>(`${cfg.api.hosting_inbox}?status=all`)
      .then((data) => {
        // Filter for this trip
        const tripRequests = data.requests.filter(r => r.trip_id === tripId);
        setRequests(tripRequests);
        setCounts(data.counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [tripId]);

  const handleDecision = async (reqId: number, decision: "approve" | "deny") => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiPost(`${cfg.api.base}/hosting-requests/${reqId}/decision/`, { decision });
      toast.success(decision === "approve" ? "Application approved!" : "Application rejected.");
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.error || "Failed to process");
    }
  };

  const pending = requests.filter(a => a.status === "pending");
  const approved = requests.filter(a => a.status === "approved");

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
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
          {requests.map(req => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                req.status === "pending" ? "border-border" : req.status === "approved" ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{(req.requester_display_name || req.requester_username || "?")[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{req.requester_display_name || req.requester_username}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] h-5",
                      req.status === "pending" ? "text-amber-600 border-amber-300" :
                      req.status === "approved" ? "text-primary border-primary/30" :
                      "text-destructive border-destructive/30"
                    )}
                  >
                    {req.status === "pending" && <Clock className="mr-0.5 h-3 w-3" />}
                    {req.status === "approved" && <CheckCircle2 className="mr-0.5 h-3 w-3" />}
                    {req.status === "denied" && <XCircle className="mr-0.5 h-3 w-3" />}
                    {req.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Applied {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingReq(req)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {req.status === "pending" && (
                  <>
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleDecision(req.id, "approve")}>Approve</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleDecision(req.id, "deny")}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={!!viewingReq} onOpenChange={() => setViewingReq(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {viewingReq && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{(viewingReq.requester_display_name || viewingReq.requester_username || "?")[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{viewingReq.requester_display_name || viewingReq.requester_username}</p>
                </div>
              </div>
              {viewingReq.message && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingReq.message}</p>
                </div>
              )}
              {viewingReq.status === "pending" && (
                <div className="flex gap-2">
                  <Button onClick={() => { handleDecision(viewingReq.id, "approve"); setViewingReq(null); }} className="flex-1">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => { handleDecision(viewingReq.id, "deny"); setViewingReq(null); }} className="flex-1">
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
