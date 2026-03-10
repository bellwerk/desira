import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PopularGiftIdeas } from "@/components/PopularGiftIdeas";
import { GlassCard } from "@/components/ui";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

// Gift box icon for Wishlist card
function GiftIcon(): React.ReactElement {
  return (
    <svg className="my-2.5 h-24 w-24" viewBox="0 0 59 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M57.9997 51.7079L47.4997 62.7079H24.833V53.7079H43.4997L49.1663 47.3503V28.7424H57.9997V51.7079Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M0.499601 28.7411L11.9996 17.7065L34.8525 17.7065L34.8525 26.7065L15.9996 26.7065L9.99963 32.7065L9.99963 51.6431L0.499599 51.6431L0.499601 28.7411Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M47.5 17.7078H34.5V26.7078H47.5V17.7078Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M24.5 53.7065H11.5V62.7065H24.5V53.7065Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M15.4059 7.79207L22.4908 0.707133L30.5879 8.8042L23.503 15.8891L15.4059 7.79207Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M40.0873 0.707162L47.1723 7.79209L39.0752 15.8892L31.9903 8.80423L40.0873 0.707162Z" fill="#2B2B2B" stroke="#2B2B2B"/>
    </svg>
  );
}

// Registry icon for Registry card
function RegistryIcon(): React.ReactElement {
  return (
    <svg className="my-2.5 h-24 w-24" viewBox="0 0 62 59" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M22.975 58.5H37.475L61.1631 35.3V14.5L50 0.5H40.375L32.4 9.5H29L21.5 0.5H11.5L0.5 14.5V35.3L22.975 58.5ZM33.5 20.5H28.05L17 9.5L10.5 16.5V31.5L28.05 49H32.4L51.25 31.5V16.5L45 9.5L33.5 20.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
    </svg>
  );
}

// Document icon for Personal card  
function DocumentIcon(): React.ReactElement {
  return (
    <svg className="my-2.5 h-24 w-24" viewBox="0 0 60 59" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48.5 0.5H35.5V9.5H48.5V0.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M43.5 18.5H16.5V26.5H43.5V18.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M43.5 32.5H16.5V40.5H43.5V32.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M50.5 12.5L50.5 23.5L59.5 23.5L59.5 12.5L50.5 12.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M0.5 35.5L0.5 46.5L9.5 46.5L9.5 35.5L0.5 35.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M0.499819 12.1001L12.0998 0.500055L35.2998 0.500057L35.2998 9.5L16.4998 9.5L9.49985 16.5L9.49985 35.3L0.499817 35.3L0.499819 12.1001Z" fill="#2B2B2B" stroke="#2B2B2B"/>
      <path d="M59.5004 47L48.3504 58.4999H25.1504V49H44.5004L50.5004 42.5V23.7H59.5004V47Z" fill="#2B2B2B" stroke="#2B2B2B"/>
    </svg>
  );
}

interface ListTypeCardProps {
  title: string;
  subtitle: string;
  descriptor: string;
  icon: React.ReactNode;
  href: string;
}

interface DashboardListSummaryRow {
  id: string;
  title: string;
  visibility: "private" | "unlisted" | "public";
  owner_id: string;
  share_token: string;
  occasion: string | null;
  event_date: string | null;
  created_at: string;
}

function parseDateOnlyToUtc(value: string): Date | null {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function ListTypeCard({
  title,
  subtitle,
  descriptor,
  icon,
  href,
}: ListTypeCardProps): React.ReactElement {
  return (
    <Link
      href={href}
      className="glass-1 group relative flex h-[280px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-[30px] px-5 pb-5 pt-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b]/25 sm:h-[290px] lg:h-[360px]"
    >
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-violet-500/5 via-transparent to-rose-500/5 pointer-events-none" />
      
      {/* Title badge */}
      <div className="absolute top-5 z-10 rounded-full bg-white/85 px-6 py-2 text-center shadow-sm backdrop-blur-sm">
        <span className="font-asul text-lg font-semibold tracking-normal text-[#2b2b2b]">{title}</span>
      </div>
      
      {/* Icon */}
      <div className="relative z-10 mb-2 mt-12 sm:mt-14">{icon}</div>
      
      {/* Subtitle */}
      <p className="relative z-10 min-h-[2.5rem] max-w-[11.5rem] text-center text-[15px] font-medium leading-[1.25] text-[#2b2b2b] transition-colors duration-300 group-hover:text-[#1f1f1f] font-[family-name:var(--font-urbanist)]">
        {subtitle}
      </p>

      {/* Descriptor */}
      <p className="relative z-10 mt-[20px] min-h-[44px] max-w-[12.75rem] rounded-full bg-white/85 px-6 py-2 text-center text-[14px] font-medium leading-[13px] text-[#2b2b2b]/70 shadow-sm backdrop-blur-sm transition-colors duration-300 group-hover:text-[#2b2b2b]/60 font-[family-name:var(--font-urbanist)]">
        {descriptor}
      </p>
    </Link>
  );
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? "";

  if (authError) {
    console.error("[DashboardPage] Auth error:", authError.message);
  }

  // Fetch profile to get display name - use maybeSingle to handle missing profiles
  let displayName = userData?.user?.email?.split("@")[0] ?? "there";
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[DashboardPage] Profile fetch error:", profileError.message, profileError.code);
    } else if (profile?.display_name) {
      displayName = profile.display_name;
    }
  } catch (err) {
    console.error("[DashboardPage] Profile fetch exception:", err);
  }

  let memberLists: DashboardListSummaryRow[] = [];
  try {
    const { data: listsData, error: listsError } = await supabase
      .from("lists")
      .select("id, title, visibility, owner_id, share_token, occasion, event_date, created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    if (listsError) {
      console.error(
        "[DashboardPage] List summary fetch error:",
        listsError.message,
        listsError.code,
        listsError.details
      );
    } else {
      memberLists = (listsData ?? []) as DashboardListSummaryRow[];
    }
  } catch (err) {
    console.error("[DashboardPage] List summary fetch exception:", err);
  }

  const ownedLists = memberLists.filter((list) => list.owner_id === userId);
  const sharedLists = memberLists.filter((list) => list.owner_id !== userId);
  const shareableLists = memberLists.filter(
    (list) => list.visibility === "public" || list.visibility === "unlisted"
  );
  const recentLists = memberLists.slice(0, 3);
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const nextUpcoming = memberLists
    .map((list) => {
      if (!list.event_date) return null;
      const eventDate = parseDateOnlyToUtc(list.event_date);
      if (!eventDate) return null;
      if (eventDate.getTime() < todayUtc.getTime()) return null;
      return { list, eventDate };
    })
    .filter((entry): entry is { list: DashboardListSummaryRow; eventDate: Date } => entry !== null)
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())[0];

  const upcomingDaysRemaining = nextUpcoming
    ? Math.max(
      0,
      Math.ceil((nextUpcoming.eventDate.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24))
    )
    : null;
  const upcomingEventDateLabel = nextUpcoming
    ? new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(nextUpcoming.eventDate)
    : null;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-start pt-6 text-[#2b2b2b] sm:pt-10">
      {/* Greeting */}
      <h1 className="px-3 text-center font-asul text-[32px] leading-tight text-[#2b2b2b] sm:text-[42px]">
        Hey {displayName}, let&apos;s make some wishes happen!
      </h1>

      {memberLists.length > 0 ? (
        <div className="mt-8 w-full max-w-[940px] sm:mt-10">
          <GlassCard className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-asul text-[26px] leading-tight text-[#2b2b2b] sm:text-[30px]">
                  Your lists at a glance
                </h2>
                <p className="mt-1 text-sm text-[#2b2b2b]/70 font-[family-name:var(--font-urbanist)]">
                  Jump back into your most recent lists or start a new one.
                </p>
              </div>
              <Link
                href="/app/lists"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#2b2b2b]/20 bg-white/75 px-4 text-sm font-medium text-[#2b2b2b] transition-colors hover:bg-white"
              >
                View all lists
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/75 px-4 py-3 text-left">
                <p className="text-xs text-[#2b2b2b]/65">Total lists</p>
                <p className="mt-1 text-2xl font-semibold text-[#2b2b2b]">{memberLists.length}</p>
              </div>
              <div className="rounded-2xl bg-white/75 px-4 py-3 text-left">
                <p className="text-xs text-[#2b2b2b]/65">Owned by you</p>
                <p className="mt-1 text-2xl font-semibold text-[#2b2b2b]">{ownedLists.length}</p>
              </div>
              <div className="rounded-2xl bg-white/75 px-4 py-3 text-left">
                <p className="text-xs text-[#2b2b2b]/65">Shared/public links</p>
                <p className="mt-1 text-2xl font-semibold text-[#2b2b2b]">{shareableLists.length}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 sm:mt-5">
              {recentLists.map((list) => {
                const isOwner = list.owner_id === userId;
                const visibilityLabel =
                  list.visibility === "public"
                    ? "Public"
                    : list.visibility === "unlisted"
                      ? "Unlisted"
                      : "Private";

                return (
                  <Link
                    key={list.id}
                    href={`/app/lists/${list.id}`}
                    className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 transition-colors hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2b2b2b]">{list.title}</p>
                      <p className="mt-0.5 text-xs text-[#2b2b2b]/65">
                        {isOwner ? "Owned by you" : "Shared with you"} · {visibilityLabel}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 text-xs font-medium text-[#2b2b2b]/60">
                      Open
                    </span>
                  </Link>
                );
              })}
            </div>

            {sharedLists.length > 0 && (
              <p className="mt-4 text-xs text-[#2b2b2b]/60">
                You currently have {sharedLists.length} list{sharedLists.length === 1 ? "" : "s"} shared with you.
              </p>
            )}

            {nextUpcoming && upcomingDaysRemaining !== null && upcomingEventDateLabel && (
              <div className="mt-4 rounded-2xl border border-[#2b2b2b]/10 bg-white/70 px-4 py-3">
                <p className="text-xs text-[#2b2b2b]/65">Upcoming event countdown</p>
                <p className="mt-1 text-sm font-semibold text-[#2b2b2b]">
                  {upcomingDaysRemaining === 0
                    ? "Today"
                    : upcomingDaysRemaining === 1
                      ? "1 day left"
                      : `${upcomingDaysRemaining} days left`}{" "}
                  for {nextUpcoming.list.occasion?.trim() || nextUpcoming.list.title}
                </p>
                <p className="mt-0.5 text-xs text-[#2b2b2b]/65">{upcomingEventDateLabel}</p>
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        <div className="relative mt-8 w-full max-w-6xl sm:mt-10">
          <div className="mx-auto grid w-full max-w-[300px] grid-cols-1 gap-5 sm:max-w-[620px] sm:grid-cols-2 lg:max-w-[940px] lg:grid-cols-3">
            <ListTypeCard
              title="Wishlist"
              subtitle="Birthdays, holidays, and more"
              descriptor="Make a wishlist others can gift from."
              icon={<GiftIcon />}
              href="/app/lists/new?type=wishlist"
            />
            <ListTypeCard
              title="Registry"
              subtitle="Weddings, showers, and birthdays"
              descriptor="Build a registry for someone special."
              icon={<RegistryIcon />}
              href="/app/lists/new?type=registry"
            />
            <ListTypeCard
              title="Personal"
              subtitle="Trips, upgrades, and daily picks"
              descriptor="Track what you want to buy next."
              icon={<DocumentIcon />}
              href="/app/lists/new?type=personal"
            />
          </div>
        </div>
      )}

      {/* Popular gift ideas section */}
      <div className="mt-8 w-full flex justify-center">
        <PopularGiftIdeas />
      </div>

    </div>
  );
}
