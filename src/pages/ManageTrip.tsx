import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import type { TripData, ParticipantData, EnrollmentRequestData, ManageTripResponse } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Users, Eye, Send, XCircle, CheckCircle2, Clock, Loader2,
  AlertTriangle, Lock, Unlock, UserMinus, MessageSquare, ClipboardList,
  Bell, MessagesSquare,
} from "lucide-react";

const ManageTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [applications, setApplications] = useState<EnrollmentRequestData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [appFilter, setAppFilter] = useState<"pending" | "approved" | "denied">("pending");

  // Group chat
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; sentAt: string }[]>([]);
  const [notifType, setNotifType] = useState("update");
  const [notifText, setNotifText] = useState("");

  const fetchData = () => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.manage_trip || !id) { setLoading(false); return; }
    apiGet<ManageTripResponse>(`${cfg.api.manage_trip}${id}/`)
      .then((data) => {
        setTrip(data.trip);
        setParticipants(data.participants);
        setApplications(data.applications);
      })
      .catch(() => toast.error("Failed to load trip data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  if (!isAuthenticated) { navigate("/login"); return null; }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="mb-2 text-2xl font-bold">Trip not found</h1>
          <Button asChild><Link to="/my-trips">Back to My Trips</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const bookingStatus = trip.booking_status || "open";
  const seatsFilled = (trip.total_seats || 0) - (trip.spots_left ?? 0);
  const isApplyType = trip.access_type === "apply";
  const pendingApps = applications.filter(a => a.status === "pending");
  const filteredApps = applications.filter(a => a.status === appFilter);

  const handleBookingToggle = async () => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const newStatus = bookingStatus === "open" ? "closed" : "open";
    try {
      await apiPost(`${cfg.api.manage_trip}${id}/booking-status/`, { status: newStatus });
      setTrip(prev => prev ? { ...prev, booking_status: newStatus } : prev);
      toast.success(newStatus === "closed" ? "Bookings closed" : "Bookings reopened");
    } catch { toast.error("Failed to update"); }
  };

  const handleRemoveParticipant = async () => {
    if (!removeId) return;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiPost(`${cfg.api.manage_trip}${id}/participants/${removeId}/remove/`, {});
      setParticipants(prev => prev.filter(p => p.id !== removeId));
      toast.success("Participant removed");
    } catch { toast.error("Failed to remove"); }
    setRemoveId(null);
  };

  const handleDecision = async (reqId: number, decision: "approve" | "deny") => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiPost(`${cfg.api.base}/hosting-requests/${reqId}/decision/`, { decision });
      setApplications(prev => prev.map(a => a.id === reqId ? { ...a, status: decision === "approve" ? "approved" : "denied" } : a));
      toast.success(decision === "approve" ? "Application approved!" : "Application rejected.");
    } catch { toast.error("Failed to process"); }
  };

  const handleCancelTrip = async () => {
    if (!cancelReason.trim()) { toast.error("Please provide a reason"); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiPost(`${cfg.api.manage_trip}${id}/cancel/`, { reason: cancelReason });
      setTrip(prev => prev ? { ...prev, status: "cancelled" } : prev);
      toast.success("Trip cancelled. Participants will be notified.");
      setCancelOpen(false);
    } catch { toast.error("Failed to cancel trip"); }
  };

  const handleMessage = async () => {
    if (!messageText.trim()) { toast.error("Please enter a message"); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiPost(`${cfg.api.manage_trip}${id}/message/`, { message: messageText });
      toast.success("Message sent to all participants");
      setMessageOpen(false);
      setMessageText("");
    } catch { toast.error("Failed to send message"); }
  };

  const statusBadge = () => {
    if (trip.status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
    if (bookingStatus === "full") return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Full</Badge>;
    if (bookingStatus === "closed") return <Badge variant="secondary">Closed</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/20">Open</Badge>;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/my-trips"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to My Trips</Link>
          </Button>

          {/* Header Summary */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-xl font-bold text-foreground truncate">{trip.title}</h1>
                    {statusBadge()}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {seatsFilled} / {trip.total_seats || "?"} seats filled
                    </span>
                    {isApplyType && pendingApps.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4" />
                        {pendingApps.length} pending application{pendingApps.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/trips/${trip.id}`}><Eye className="mr-1.5 h-4 w-4" /> Preview</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMessageOpen(true)}>
                    <MessageSquare className="mr-1.5 h-4 w-4" /> Message All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBookingToggle}
                    disabled={trip.status === "cancelled"}
                  >
                    {bookingStatus === "open" ? (
                      <><Lock className="mr-1.5 h-4 w-4" /> Close Bookings</>
                    ) : (
                      <><Unlock className="mr-1.5 h-4 w-4" /> Reopen Bookings</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="participants">
            <TabsList className="mb-4">
              <TabsTrigger value="participants">
                Participants
                {participants.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{participants.length}</Badge>}
              </TabsTrigger>
              {isApplyType && (
                <TabsTrigger value="applications">
                  Applications
                  {pendingApps.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{pendingApps.length}</Badge>}
                </TabsTrigger>
              )}
              <TabsTrigger value="chat">
                <MessagesSquare className="mr-1.5 h-4 w-4" /> Group Chat
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="mr-1.5 h-4 w-4" /> Notifications
              </TabsTrigger>
            </TabsList>

            {/* Participants Tab */}
            <TabsContent value="participants">
              {participants.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No participants yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {participants.map(p => (
                    <Card key={p.id}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{(p.display_name || p.username)[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.display_name || p.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(p.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoveId(p.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Applications Tab */}
            {isApplyType && (
              <TabsContent value="applications">
                <div className="mb-4 flex gap-2">
                  {(["pending", "approved", "denied"] as const).map(s => (
                    <Button
                      key={s}
                      variant={appFilter === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAppFilter(s)}
                      className="capitalize"
                    >
                      {s}
                      <Badge variant="secondary" className="ml-1.5 text-xs">
                        {applications.filter(a => a.status === s).length}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {filteredApps.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No {appFilter} applications</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredApps.map(app => (
                      <Card key={app.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{(app.requester_display_name || app.requester_username)[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">{app.requester_display_name || app.requester_username}</p>
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
                                  {app.status === "denied" && <XCircle className="mr-0.5 h-3 w-3" />}
                                  {app.status}
                                </Badge>
                              </div>
                              {app.message && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{app.message}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Applied {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            {app.status === "pending" && (
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-8 text-xs" onClick={() => handleDecision(app.id, "approve")}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleDecision(app.id, "deny")}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Group Chat Tab */}
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessagesSquare className="h-5 w-5 text-primary" />
                    Group Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/20 p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                    ) : (
                      chatMessages.map(msg => (
                        <div key={msg.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs">{msg.sender[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-foreground">{msg.sender}</span>
                              <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message to the group..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      rows={2}
                      className="flex-1"
                    />
                    <Button className="shrink-0 self-end" onClick={() => {
                      if (chatInput.trim()) {
                        setChatMessages(prev => [...prev, {
                          id: `msg-${Date.now()}`,
                          sender: "You (Host)",
                          text: chatInput.trim(),
                          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                        }]);
                        setChatInput("");
                        toast.success("Message sent to group");
                      }
                    }}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" />
                    Send Notification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "update", label: "Trip Update", desc: "General trip info" },
                      { value: "payment", label: "Payment Reminder", desc: "Payment-related" },
                      { value: "announcement", label: "Announcement", desc: "Important notice" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNotifType(opt.value)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-all",
                          notifType === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
                        )}
                      >
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Write your notification message..."
                    value={notifText}
                    onChange={e => setNotifText(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={() => {
                    if (!notifText.trim()) { toast.error("Please write a message"); return; }
                    setNotifications(prev => [...prev, {
                      id: `n-${Date.now()}`,
                      type: notifType,
                      message: notifText.trim(),
                      sentAt: new Date().toISOString(),
                    }]);
                    toast.success("Notification sent to all participants");
                    setNotifText("");
                  }}>
                    <Bell className="mr-1.5 h-4 w-4" /> Send Notification
                  </Button>

                  {notifications.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Sent Notifications</p>
                      {notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                          <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className="text-[10px] capitalize">{n.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(n.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Danger Zone — Cancel Trip */}
          {trip.status !== "cancelled" && (
            <div className="mt-10 rounded-lg border border-destructive/30 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Cancelling a trip will notify all participants. This action cannot be undone.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
                Cancel Trip
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Remove Participant Modal */}
      <Dialog open={removeId != null} onOpenChange={() => setRemoveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Participant
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this participant? They will be notified.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveParticipant}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Trip Modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Trip
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will cancel the trip and notify all {participants.length} participant{participants.length !== 1 ? "s" : ""}.
            </p>
            <Textarea
              placeholder="Reason for cancellation (required)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Participants will be notified with your reason
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Trip</Button>
            <Button variant="destructive" onClick={handleCancelTrip}>Confirm Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Message Participants
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send a message to all {participants.length} participant{participants.length !== 1 ? "s" : ""}.
            </p>
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button onClick={handleMessage}>
              <Send className="mr-1.5 h-4 w-4" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageTrip;
