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

interface Appointment {
  appt_id: number;
  date_time: string;
  status: string;
  user_notes: string | null;
  healthcare_providers: {
    full_name: string;
    facility_name: string;
  };
}

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
];

const Dashboard = () => {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("appt_id, date_time, status, user_notes, healthcare_providers(full_name, facility_name)")
      .eq("user_id", 1)
      .order("date_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      return;
    }
    setAppointments((data as unknown as Appointment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const upcoming = appointments.filter((a) => a.status === "scheduled");
  const past = appointments.filter((a) => a.status === "completed");
  const nextAppt = upcoming[0];

  const openReschedule = (appt: Appointment) => {
    setSelectedAppt(appt);
    setNewDate(new Date(appt.date_time));
    setNewTime(format(new Date(appt.date_time), "h:mm a"));
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedAppt || !newDate || !newTime) return;
    setSaving(true);

    // Parse time string into hours/minutes
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
      .select("appt_id, date_time, status, user_notes, healthcare_providers(full_name, facility_name)");

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to reschedule appointment.", variant: "destructive" });
      console.error(error);
      return;
    }

    // Update local state with the returned row
    if (data && data.length > 0) {
      setAppointments((prev) =>
        prev.map((a) => (a.appt_id === selectedAppt.appt_id ? (data[0] as unknown as Appointment) : a))
      );
    }

    setRescheduleOpen(false);
    toast({ title: "Rescheduled!", description: `Appointment moved to ${format(updatedDate, "M/d/yy 'at' h:mm a")}` });
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
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hi, Chad 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your health overview</p>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/profile"
          className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">$67</p>
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

      {/* Next Appointment Card */}
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
            <p className="text-sm text-muted-foreground">{nextAppt.healthcare_providers.full_name}</p>
            <p className="text-xs text-muted-foreground">{nextAppt.healthcare_providers.facility_name}</p>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => openReschedule(nextAppt)}
              className="flex-1 text-sm py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Reschedule
            </button>
            <button className="flex-1 text-sm py-2 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Appointments Tabs */}
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
              onClick={() => tab === "upcoming" ? openReschedule(appt) : undefined}
            >
              {tab === "upcoming" ? (
                <Star className="w-4 h-4 shrink-0 text-muted-foreground" />
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(appt.date_time), "M/d/yy")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {appt.healthcare_providers.full_name}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Button */}
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity">
        <Plus className="w-4 h-4" />
        Schedule an Appointment
      </button>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            {selectedAppt && (
              <p className="text-sm text-muted-foreground">
                {selectedAppt.healthcare_providers.full_name} at {selectedAppt.healthcare_providers.facility_name}
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
    </div>
  );
};

export default Dashboard;
