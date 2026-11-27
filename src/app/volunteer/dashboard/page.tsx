import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import NotificationList from "@/components/NotificationList";

export default async function VolunteerDashboard() {
  const supabase = await createClient();

  // 1. Verify authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verify volunteer role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "VOLUNTEER") {
    redirect("/login");
  }

  const dashboardCards = [
    {
      title: "My Attendance",
      description: "View your attendance records.",
      href: null,
      action: "Attendance information",
    },
    {
      title: "My Justifications",
      description: "Submit and track absence justifications.",
      href: null,
      action: "Justification information",
    },
    {
      title: "My Evaluations",
      description: "View your weekly and monthly performance evaluations.",
      href: "/volunteer/evaluations",
      action: "View Evaluations",
    },
    {
      title: "My Leave Applications",
      description: "Apply for leave and track your application status.",
      href: "/volunteer/leaves",
      action: "View Applications",
    },
  ];

  return (
    <main
    id="main-content"
    className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Dashboard Header */}
        <header className="rounded-2xl border border-line bg-cream p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Volunteer Portal</p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Volunteer Dashboard
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
                Welcome, {profile.full_name}!
              </p>

              <p className="mt-1 text-xs text-muted/70">
                Stay updated with your activities and volunteer journey.
              </p>
            </div>

            <div className="shrink-0">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Notifications */}
        <NotificationList profileId={user.id} />

        {/* Volunteer Services */}
        <section
          aria-labelledby="services-heading"
          className="mt-10"
        >
          <div className="mb-5">
            <p className="eyebrow">Your workspace</p>

            <h2
              id="services-heading"
              className="mt-2 text-2xl font-semibold text-ink"
            >
              My Activities
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted">
              Access your attendance, justifications and personal records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => {
              const cardContent = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-ink">
                      {card.title}
                    </h3>

                    {card.href && (
                      <span
                        aria-hidden="true"
                        className="text-xl text-accent-strong transition-transform group-hover:translate-x-1"
                      >
                        &#8594;
                      </span>
                    )}
                  </div>

                  <p className="mt-3 flex-1 text-sm leading-6 text-muted">
                    {card.description}
                  </p>

                  <span
                    className={`mt-5 text-xs font-semibold ${
                      card.href
                        ? "text-accent-strong"
                        : "text-muted/70"
                    }`}
                  >
                    {card.action}
                  </span>
                </>
              );

              if (card.href) {
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    aria-label={card.action}
                    className="group flex min-h-40 flex-col rounded-2xl border border-line bg-cream p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-6"
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <article
                  key={card.title}
                  className="flex min-h-40 flex-col rounded-2xl border border-line bg-cream p-5 shadow-sm sm:p-6"
                >
                  {cardContent}
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-line py-6">
          <p className="text-center text-xs leading-5 text-muted/70">
            Tori School Volunteer Portal &#183; Volunteer Management System
          </p>
        </footer>
      </div>
    </main>
  );
}