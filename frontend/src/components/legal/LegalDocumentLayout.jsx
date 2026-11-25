import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function LegalDocumentLayout({
  eyebrow = 'Legal & Compliance',
  title,
  lastUpdated,
  summaryTitle = 'The Short Version',
  summaryPoints = [],
  noticeTitle,
  noticeBody,
  siblingLabel,
  siblingTo,
  sections = [],
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');

  useEffect(() => {
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-6">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              {title}
            </h1>
            <p className="text-sm text-on-surface-variant">
              Human Shelter Realty Corp. · Last updated {lastUpdated}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {siblingTo && siblingLabel && (
              <Button variant="outline" className="h-11 px-4 rounded-lg border-outline" asChild>
                <Link to={siblingTo}>
                  <FileText className="size-4" aria-hidden="true" />
                  <span>{siblingLabel}</span>
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 rounded-lg border-outline"
              onClick={() => window.print()}
            >
              <Printer className="size-4" aria-hidden="true" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </header>

        {/* Plain-English Summary */}
        {summaryPoints.length > 0 && (
          <Card className="bg-surface border border-outline rounded-xl shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-on-surface flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary shrink-0" aria-hidden="true" />
                <span>{summaryTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-on-surface-variant">
                {summaryPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span
                      className="size-2 rounded-full bg-primary mt-2 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Mobile Section Jumper */}
        {sections.length > 0 && (
          <div className="lg:hidden print:hidden">
            <Select value={activeId} onValueChange={scrollToSection}>
              <SelectTrigger className="h-11 w-full bg-surface border-outline rounded-lg">
                <SelectValue placeholder="Jump to section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section, idx) => (
                  <SelectItem key={section.id} value={section.id}>
                    {idx + 1}. {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sticky ToC + Document Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Desktop Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 print:hidden">
            <Card className="bg-surface border border-outline rounded-xl shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Table of Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav aria-label="Table of Contents" className="flex flex-col gap-1">
                  {sections.map((section, idx) => {
                    const isActive = activeId === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                          isActive
                            ? 'bg-tertiary-container text-primary font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {idx + 1}. {section.title}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Legal Content */}
          <div className="lg:col-span-8 min-w-0 flex flex-col gap-6">
            {noticeTitle && noticeBody && (
              <Alert className="bg-surface border-outline rounded-xl">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                <AlertTitle className="text-on-surface font-semibold">{noticeTitle}</AlertTitle>
                <AlertDescription className="text-on-surface-variant">
                  {noticeBody}
                </AlertDescription>
              </Alert>
            )}

            <Card className="bg-surface border border-outline rounded-xl shadow-xs">
              <CardContent className="p-6 md:p-8 flex flex-col gap-8">
                {sections.map((section, idx) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24 flex flex-col gap-3"
                  >
                    <h2 className="text-xl font-semibold tracking-tight text-on-surface">
                      {idx + 1}. {section.title}
                    </h2>
                    {section.paragraphs?.map((text, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-sm md:text-base leading-relaxed text-on-surface-variant max-w-prose"
                      >
                        {text}
                      </p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="flex flex-col gap-2 pl-5 list-disc text-sm md:text-base leading-relaxed text-on-surface-variant max-w-prose">
                        {section.bullets.map((item, bIdx) => (
                          <li key={bIdx}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {idx < sections.length - 1 && <Separator className="mt-4 bg-outline" />}
                  </section>
                ))}
              </CardContent>
            </Card>

            {/* Contact & Data Requests Card */}
            <Card className="bg-surface border border-outline rounded-xl shadow-xs print:hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-on-surface">
                  Questions or Data Requests?
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm text-on-surface-variant">
                <p className="leading-relaxed">
                  Reach out to Human Shelter Realty Corp. if you have questions about these terms or
                  want to review, update, or delete your personal information.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="mailto:support@humanshelter.info"
                    className="inline-flex items-center gap-2 text-primary hover:underline w-fit"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span>support@humanshelter.info</span>
                  </a>
                  <a
                    href="tel:+639173206778"
                    className="inline-flex items-center gap-2 text-primary hover:underline w-fit"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    <span>+63 917 320 6778</span>
                  </a>
                  <div className="inline-flex items-start gap-2">
                    <MapPin className="size-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
                    <span>26 Domitilla St., Provident Village, Tañong, Marikina City</span>
                  </div>
                </div>
                <div>
                  <Button className="h-11 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white" asChild>
                    <Link to="/contact">
                      <span>Contact Support</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
