import { Search, ChevronRight, BookOpen, Brain, Bone, Heart, Baby, Pill } from "lucide-react";
import { useState } from "react";

const categories = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "mental", label: "Mental Health", icon: Brain },
  { id: "physical", label: "Physical Injuries", icon: Bone },
  { id: "heart", label: "Heart & Cardio", icon: Heart },
  { id: "family", label: "Family Health", icon: Baby },
  { id: "medication", label: "Medications", icon: Pill },
];

const articles = [
  {
    id: 1,
    category: "mental",
    title: "Control Mental Health Before It Gets to You Negatively",
    summary: "Early signs of stress and anxiety are often overlooked. Learn the 5 daily habits that mental health professionals recommend for building resilience.",
    source: "CDC",
  },
  {
    id: 2,
    category: "physical",
    title: "Broken Bones? Know What Help and Care You Need",
    summary: "Understanding when to visit urgent care vs. the ER for fractures can save you time and money. Here's a quick decision guide.",
    source: "Mayo Clinic",
  },
  {
    id: 3,
    category: "physical",
    title: "Tummy Hurting? 5 Most Useful Things to Ensure Gut Health",
    summary: "Digestive issues affect 70 million Americans. These evidence-based tips can help you manage common stomach problems at home.",
    source: "NIH",
  },
  {
    id: 4,
    category: "mental",
    title: "Sleeplessness Is No Joke: 5 Ways to Home-Remedy",
    summary: "Poor sleep is linked to chronic disease. Try these clinically supported methods before considering medication.",
    source: "Sleep Foundation",
  },
  {
    id: 5,
    category: "heart",
    title: "Understanding Your Blood Pressure Numbers",
    summary: "High blood pressure rarely has symptoms. Learn what your numbers mean and when to talk to your doctor about management options.",
    source: "AHA",
  },
  {
    id: 6,
    category: "family",
    title: "When Should Your Child See a Specialist?",
    summary: "Pediatricians can handle most issues, but some symptoms warrant a specialist visit. Here's what to watch for at every age.",
    source: "AAP",
  },
  {
    id: 7,
    category: "medication",
    title: "Generic vs. Brand-Name: What's the Real Difference?",
    summary: "Generic drugs can save you 80-85% on costs. The FDA requires them to work the same way — here's what that means for you.",
    source: "FDA",
  },
];

const Resources = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = articles.filter((a) => {
    const matchesCategory = activeCategory === "all" || a.category === activeCategory;
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Health Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse trusted health articles by topic</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filtered.map((article) => (
          <article
            key={article.id}
            className="glass-card rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {article.summary}
                </p>
                <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {article.source}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No articles found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
