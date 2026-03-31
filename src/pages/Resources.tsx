import { Search, BookOpen, Brain, Bone, Heart, Baby, Pill, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const categories = [
  { id: "all",        label: "All",              icon: BookOpen },
  { id: "mental",     label: "Mental Health",    icon: Brain },
  { id: "physical",   label: "Physical Injuries",icon: Bone },
  { id: "heart",      label: "Heart & Cardio",   icon: Heart },
  { id: "family",     label: "Family Health",    icon: Baby },
  { id: "medication", label: "Medications",      icon: Pill },
];

const faqItems = [
  {
    id: "faq-1",
    question: "When should I use urgent care vs. the emergency room?",
    answer:
      "Use urgent care for non-life-threatening issues like minor cuts, mild fevers, or sprains. Go to the ER for severe symptoms such as chest pain, trouble breathing, stroke signs, heavy bleeding, or major injuries.",
  },
  {
    id: "faq-2",
    question: "What is the difference between a copay and a deductible?",
    answer:
      "A copay is a fixed amount you pay at a visit or for a prescription. A deductible is the amount you must pay out of pocket before your plan starts covering more costs.",
  },
  {
    id: "faq-3",
    question: "How can I tell if a doctor is in-network?",
    answer:
      "Check your insurance provider directory first, then call the doctor's office to confirm they accept your exact plan. In-network providers usually cost less than out-of-network providers.",
  },
  {
    id: "faq-4",
    question: "What should I bring to a medical appointment?",
    answer:
      "Bring your insurance card, photo ID, medication list, symptoms timeline, and any recent test results or questions you want answered.",
  },
  {
    id: "faq-5",
    question: "Can I use telehealth for this issue?",
    answer:
      "Telehealth is great for follow-ups, medication questions, minor symptoms, and mental health visits. For severe pain, breathing issues, or emergencies, seek in-person emergency care immediately.",
  },
];

interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  provider: "NewsAPI" | "MedlinePlus";
}

const SkeletonCard = () => (
  <div className="glass-card rounded-xl p-4 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-5 bg-muted rounded w-20 mt-2" />
      </div>
      <div className="h-4 w-4 bg-muted rounded shrink-0 mt-1" />
    </div>
  </div>
);

const Resources = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/articles?category=${activeCategory}`)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load articles. Make sure the server is running.");
        setLoading(false);
      });
  }, [activeCategory]);

  const filtered = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Health Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse trusted health articles from NewsAPI and MedlinePlus
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-5 items-start">
        {/* Articles */}
        <div className="space-y-3">
          {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}

          {error && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>
                  <span
                    className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      article.provider === "MedlinePlus"
                        ? "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40"
                        : "text-primary bg-primary/10"
                    }`}
                  >
                    {article.source}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
              </div>
            </a>
          ))}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No articles found. Try a different search or category.</p>
            </div>
          )}
        </div>

        {/* FAQ side panel */}
        <div className="glass-card rounded-xl p-5 lg:sticky lg:top-24">
          <div className="mb-2">
            <h2 className="text-base font-semibold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Quick answers to common care and insurance questions.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-sm text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Resources;
