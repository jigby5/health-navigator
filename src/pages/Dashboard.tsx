import { Calendar, DollarSign, User, Clock, Star, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const upcomingAppointments = [
  { date: "2/7/26", time: "10:00 AM", doctor: "Dr. Carsonian", location: "InterHills Health", starred: true },
  { date: "3/15/26", time: "2:30 PM", doctor: "Dr. George", location: "City Medical Center", starred: false },
];

const pastAppointments = [
  { date: "2/20/25", time: "9:00 AM", doctor: "Dr. George", location: "City Medical Center" },
  { date: "1/5/26", time: "11:00 AM", doctor: "Dr. Danger", location: "Westside Clinic" },
  { date: "12/23/25", time: "3:00 PM", doctor: "Dr. J.E. Barber-Howell", location: "InterHills Health" },
];

const Dashboard = () => {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const nextAppt = upcomingAppointments[0];

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
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Next Appointment</h2>
        </div>
        <div className="text-center py-3">
          <p className="text-lg font-bold text-foreground">
            {nextAppt.date}, {nextAppt.time}
          </p>
          <p className="text-sm text-muted-foreground">{nextAppt.doctor}</p>
          <p className="text-xs text-muted-foreground">{nextAppt.location}</p>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 text-sm py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Reschedule
          </button>
          <button className="flex-1 text-sm py-2 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition-colors">
            Cancel
          </button>
        </div>
      </div>

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
          {(tab === "upcoming" ? upcomingAppointments : pastAppointments).map((appt, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:shadow-sm transition-shadow"
            >
              {tab === "upcoming" && (
                <Star
                  className={`w-4 h-4 shrink-0 ${
                    "starred" in appt && appt.starred ? "text-warning fill-warning" : "text-muted-foreground"
                  }`}
                />
              )}
              {tab === "past" && <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{appt.date}</p>
                <p className="text-xs text-muted-foreground truncate">{appt.doctor}</p>
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
    </div>
  );
};

export default Dashboard;
