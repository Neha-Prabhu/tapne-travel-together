import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api";
import type { EnrollmentRequestData, HostingInboxResponse, ManageTripResponse, ParticipantData } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Eye, ClipboardList, Loader2, UserMinus, Send, Users } from "lucide-react";

interface ApplicationManagerProps {
  tripId: number;
}

const ApplicationManager = ({ tripId }: ApplicationManagerProps) => {
  const [requests, setRequests] = useState<EnrollmentRequestData[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReq, setViewingReq] = useState<EnrollmentRequestData | null>(null);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, denied: 0 });
  const [removeTarget, setRemoveTarget] = useState<ParticipantData | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastPending, setBroadcastPending] = useState(false);

  const fetchData = () => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.hosting_inbox) { setLoading(false); return; }
    const inboxP = apiGet<HostingInboxResponse>(`${cfg.api.hosting_inbox}?status=all`)
      .then((data) => {
        const tripRequests = data.requests.filter(r => r.trip_id === tripId);
        setRequests(tripRequests);
        setCounts(data.counts);
      })
      .catch(() => {});
    const manageP = cfg.api.manage_trip
      ? apiGet<ManageTripResponse>(`${cfg.api.manage_trip}${tripId}/`)
          .then((data) => setParticipants(data.participants || []))
          .catch(() => {})
      : Promise.resolve();
    Promise.all([inboxP, manageP]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [tripId]);

  const handleDecision = async (reqId: number, decision: "approve" | "deny") => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiPost(`${cfg.api.base}/hosting-requests/${reqId}/decision/`, { decision });
      toast.success(decision === "approve" ? "Application approved!" : "Application rejected.");
      fetchData();
    } catch (err: any) {
      toast.error(err?.error || "Failed to process");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    setRemovePending(true);
    try {
      await apiPost(`${cfg.api.base}/trips/${tripId}/participants/${removeTarget.user_id}/remove/`, {});
      toast.success(`${removeTarget.display_name || removeTarget.username} removed from trip.`);
      setRemoveTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.error || "Could not remove participant. Please try again.");
    } finally {
      setRemovePending(false);
    }
  };

  const handleBroadcast = async () => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const body = broadcastBody.trim();
    if (!body) return;
    setBroadcastPending(true);
    try {
      await apiPost(`${cfg.api.base}/trips/${tripId}/broadcast/`, { message: body });
      toast.success(`Message sent to ${participants.length} participant${participants.length !== 1 ? "s" : ""}.`);
      setBroadcastOpen(false);
      setBroadcastBody("");
    } catch (err: any) {
      toast.error(err?.error || "Could not send message. Please try again.");
    } finally {
      setBroadcastPending(false);
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

  if (requests.length === 0 && participants.length === 0) {
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">Applications</CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {pending.length > 0 && <Badge variant="secondary" className="text-xs">{pending.length} pending</Badge>}
              {approved.length > 0 && <Badge className="text-xs bg-primary/10 text-primary border-0">{approved.length} approved</Badge>}
              {participants.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setBroadcastOpen(true)}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Message All
                </Button>
              )}
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

          {participants.length > 0 && (
            <div className="pt-3 mt-3 border-t">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Confirmed Participants ({participants.length})
              </div>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{(p.display_name || p.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.display_name || p.username}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(p.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => setRemoveTarget(p)}
                    >
                      <UserMinus className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

      {/* Remove Participant confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => { if (!removePending && !o) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove participant?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget && (<>Remove <span className="font-medium text-foreground">{removeTarget.display_name || removeTarget.username}</span> from this trip? They will be notified.</>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePending}>Keep</AlertDialogCancel>
            <AlertDialogAction
              disabled={removePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); handleRemove(); }}
            >
              {removePending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Broadcast dialog */}
      <Dialog open={broadcastOpen} onOpenChange={(o) => { if (!broadcastPending) setBroadcastOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message All Participants</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will be sent to {participants.length} confirmed participant{participants.length !== 1 ? "s" : ""}.
            </p>
            <Textarea
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Write your update…"
              rows={5}
              disabled={broadcastPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)} disabled={broadcastPending}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={broadcastPending || broadcastBody.trim().length === 0}>
              {broadcastPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApplicationManager;
