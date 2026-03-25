import { Calendar, DollarSign, User, Clock, Star, ChevronRight, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  appt_id: number;
  date_time: string;
  doctor_id: number | null;
  status: string;
  user_notes: string | null;
  healthcare_providers: {
    full_name: string;
    facility_name: string;
    specialty: string;
  } | null;
}

interface Provider {
  doctor_id: number;
  full_name: string;
  facility_name: string;
  specialty: string;
}

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
];

const Dashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [doctorInfoOpen, setDoctorInfoOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("appt_id, date_time, doctor_id, status, user_notes, healthcare_providers(full_name, facility_name, specialty)")
        .eq("user_id", user.user_id)
        .order("date_time", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
        setLoadError(error.message);
        toast({
          title: "Couldn't load appointments",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setAppointments((data as unknown as Appointment[]) || []);
    } catch (e) {
      console.error("Unexpected error fetching appointments:", e);
      const message = e instanceof Error ? e.message : "Unknown error";
      setAppointments([]);
      setLoadError(message);
      toast({
        title: "Couldn't load appointments",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCancelDialog = (appt: Appointment) => {
    setApptToCancel(appt);
    setCancelOpen(true);
  };

  const fetchProviders = async () => {
    const { data, error } = await supabase
      .from("healthcare_providers")
      .select("doctor_id, full_name, facility_name, specialty")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Couldn't load providers",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProviders(data || []);
  };

  useEffect(() => {
    fetchAppointments();
    fetchProviders();
  }, [user]);

  const upcoming = appointments.filter((a) => a.status === "scheduled");
  const past = appointments.filter((a) => a.status === "completed");
  const nextAppt = upcoming[0];

  const openReschedule = (appt: Appointment) => {
    setSelectedAppt(appt);
    setNewDate(new Date(appt.date_time));
    setNewTime(format(new Date(appt.date_time), "h:mm a"));
    setRescheduleOpen(true);
  };

  const openAppointmentDetails = (appt: Appointment) => {
    setSelectedAppt(appt);
    setAppointmentDetailsOpen(true);
  };

  const openScheduleDialog = () => {
    setSelectedDoctorId("");
    setScheduleDate(undefined);
    setScheduleTime("");
    setScheduleNotes("");
    setScheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedAppt || !newDate || !newTime) return;
    setSaving(true);

    const [timePart, ampm] = newTime.split(" ");
    const [hourStr, minStr] = timePart.split(":");
    let hours = parseInt(hourStr);
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const updatedDate = new Date(newDate);
    updatedDate.setHours(hours, parseInt(minStr), 0, 0);

    const { data, error } = await supabase
      .from("appointments")
      .update({ date_time: updatedDate.toISOString() })
      .eq("appt_id", selectedAppt.appt_id)
      .select("appt_id, date_time, doctor_id, status, user_notes, healthcare_providers(full_name, facility_name, specialty)");

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to reschedule appointment.", variant: "destructive" });
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      setAppointments((prev) =>
        prev.map((a) => (a.appt_id === selectedAppt.appt_id ? (data[0] as unknown as Appointment) : a))
      );
    }

    setRescheduleOpen(false);
    toast({ title: "Rescheduled!", description: `Appointment moved to ${format(updatedDate, "M/d/yy 'at' h:mm a")}` });
  };

  const handleScheduleAppointment = async () => {
    if (!user || !selectedDoctorId || !scheduleDate || !scheduleTime) {
      toast({
        title: "Missing information",
        description: "Please choose a provider, date, and time.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const [timePart, ampm] = scheduleTime.split(" ");
    const [hourStr, minStr] = timePart.split(":");
    let hours = parseInt(hourStr);

    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const appointmentDate = new Date(scheduleDate);
    appointmentDate.setHours(hours, parseInt(minStr), 0, 0);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: user.user_id,
        doctor_id: parseInt(selectedDoctorId),
        date_time: appointmentDate.toISOString(),
        status: "scheduled",
        user_notes: scheduleNotes || null,
      })
      .select("appt_id, date_time, doctor_id, status, user_notes, healthcare_providers(full_name, facility_name, specialty)");

    setSaving(false);

    if (error) {
      console.error("Error scheduling appointment:", error);
      toast({
        title: "Couldn't schedule appointment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      setAppointments((prev) =>
        [...prev, data[0] as unknown as Appointment].sort(
          (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        )
      );
    }

    setScheduleOpen(false);

    toast({
      title: "Appointment scheduled",
      description: `Your appointment was set for ${format(appointmentDate, "M/d/yy 'at' h:mm a")}.`,
    });
  };

  const handleCancelAppointment = async () => {
    if (!apptToCancel) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("appt_id", apptToCancel.appt_id)
      .select("appt_id, date_time, doctor_id, status, user_notes, healthcare_providers(full_name, facility_name, specialty)");

    setSaving(false);

    if (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Couldn't cancel appointment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      setAppointments((prev) =>
        prev.map((a) => (a.appt_id === apptToCancel.appt_id ? (data[0] as unknown as Appointment) : a))
      );
    }

    setCancelOpen(false);
    setApptToCancel(null);

    toast({
      title: "Appointment cancelled",
      description: "Your appointment has been cancelled.",
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hi, {user?.first_name ?? "Chad"}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your health overview</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">Appointments failed to load</p>
          <p className="text-xs text-muted-foreground mt-1 break-words">{loadError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/transactions"
          className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">${user?.total_balance_due?.toFixed(0) ?? "0"}</p>
            <p className="text-xs text-muted-foreground">Remaining balance</p>
          </div>
        </Link>
        <Link
          to="/profile"
          className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">My Medical</p>
            <p className="text-xs text-muted-foreground">Profile</p>
          </div>
        </Link>
      </div>

      {nextAppt && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Next Appointment</h2>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-foreground">
              {format(new Date(nextAppt.date_time), "M/d/yy")}, {format(new Date(nextAppt.date_time), "h:mm a")}
            </p>
            <p className="text-sm text-muted-foreground">
              {nextAppt.healthcare_providers?.full_name ?? "Unknown provider"}
            </p>
            <p className="text-xs text-muted-foreground">
              {nextAppt.healthcare_providers?.facility_name ?? "Unknown facility"}
            </p>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => openReschedule(nextAppt)}
              className="flex-1 text-sm py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Reschedule
            </button>
            <button
              onClick={() => openCancelDialog(nextAppt)}
              className="flex-1 text-sm py-2 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setTab("upcoming")}
            className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
              tab === "upcoming"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTab("past")}
            className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
              tab === "past"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Past
          </button>
        </div>

        <div className="space-y-2">
          {(tab === "upcoming" ? upcoming : past).map((appt) => (
            <div
              key={appt.appt_id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => openAppointmentDetails(appt)}
            >
              {tab === "upcoming" ? (
                <Star className="w-4 h-4 shrink-0 text-muted-foreground" />
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(appt.date_time), "M/d/yy")} at{" "}
                  {format(new Date(appt.date_time), "h:mm a")}
                </p>

                <p className="text-sm font-medium text-foreground truncate">
                  {appt.healthcare_providers?.full_name ?? "Unknown provider"}
                </p>

                <p className="text-xs text-muted-foreground truncate">
                  {appt.healthcare_providers?.facility_name ?? "Unknown facility"}
                </p>

                {appt.healthcare_providers?.specialty && (
                  <p className="text-xs text-muted-foreground truncate">
                    {appt.healthcare_providers.specialty}
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={openScheduleDialog}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Schedule an Appointment
      </button>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            {selectedAppt && (
              <p className="text-sm text-muted-foreground">
                {(selectedAppt.healthcare_providers?.full_name ?? "Unknown provider")} at{" "}
                {(selectedAppt.healthcare_providers?.facility_name ?? "Unknown facility")}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Select new date</p>
              <CalendarPicker
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                disabled={(date) => date < new Date()}
                className={cn("p-3 pointer-events-auto rounded-md border")}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Select new time</p>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={saving || !newDate || !newTime}>
              {saving ? "Saving..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={appointmentDetailsOpen} onOpenChange={setAppointmentDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment</DialogTitle>
            {selectedAppt && (
              <p className="text-sm text-muted-foreground">
                {selectedAppt.healthcare_providers?.full_name ?? "Unknown provider"} •{" "}
                {format(new Date(selectedAppt.date_time), "M/d/yy 'at' h:mm a")}
              </p>
            )}
          </DialogHeader>

          {selectedAppt && (
            <div className="space-y-3">
              {selectedAppt.user_notes && (
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground mt-1 break-words">{selectedAppt.user_notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDoctorInfoOpen(true)}
                  disabled={!selectedAppt.healthcare_providers}
                >
                  View doctor info
                </Button>
                {selectedAppt.status === "scheduled" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAppointmentDetailsOpen(false);
                      openReschedule(selectedAppt);
                    }}
                  >
                    Reschedule
                  </Button>
                )}
              </div>

              {selectedAppt.status === "scheduled" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setAppointmentDetailsOpen(false);
                    openCancelDialog(selectedAppt);
                  }}
                >
                  Cancel appointment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Doctor Info Dialog */}
      <Dialog open={doctorInfoOpen} onOpenChange={setDoctorInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Doctor information</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Name</p>
              <p className="text-sm text-foreground mt-1">
                {selectedAppt?.healthcare_providers?.full_name ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Hospital</p>
              <p className="text-sm text-foreground mt-1">
                {selectedAppt?.healthcare_providers?.facility_name ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Specialty</p>
              <p className="text-sm text-foreground mt-1">
                {selectedAppt?.healthcare_providers?.specialty ?? "Unknown"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setDoctorInfoOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*new schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose a provider, date, and time for your new appointment.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Provider</p>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.doctor_id} value={String(provider.doctor_id)}>
                      {provider.full_name} - {provider.facility_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Date</p>
              <CalendarPicker
                mode="single"
                selected={scheduleDate}
                onSelect={setScheduleDate}
                disabled={(date) => date < new Date()}
                className={cn("p-3 pointer-events-auto rounded-md border")}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Time</p>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Notes</p>
              <Input
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                placeholder="Optional reason for visit"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleAppointment}
              disabled={saving || !selectedDoctorId || !scheduleDate || !scheduleTime}
            >
              {saving ? "Saving..." : "Confirm Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this appointment?
            </p>
            {apptToCancel && (
              <p className="text-sm text-foreground mt-2">
                {apptToCancel.healthcare_providers?.full_name ?? "Unknown provider"} on{" "}
                {format(new Date(apptToCancel.date_time), "M/d/yy 'at' h:mm a")}
              </p>
            )}
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment} disabled={saving}>
              {saving ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
