import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PopularGiftIdeas } from "@/components/PopularGiftIdeas";

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
  icon: React.ReactNode;
}

function ListTypeCard({ title, subtitle, icon }: ListTypeCardProps): React.ReactElement {
  return (
    <Link
      href="/app/lists/new"
      className="glass-1 group relative flex h-[300px] w-[230px] flex-col items-center justify-center rounded-[30px] px-[21px] text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
    >
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-violet-500/5 via-transparent to-rose-500/5 pointer-events-none" />
      
      {/* Title badge */}
      <div className="absolute top-5 mt-3.5 mb-3.5 rounded-full bg-white/80 px-6 py-2 text-center shadow-sm z-10">
        <span className="font-asul text-lg font-semibold tracking-normal text-[#2b2b2b]">{title}</span>
      </div>
      
      {/* Icon */}
      <div className="relative z-10 mb-2.5 mt-15">{icon}</div>
      
      {/* Subtitle */}
      <p className="relative z-10 flex h-fit max-w-[10rem] flex-wrap justify-center text-center text-base leading-tight text-[#2b2b2b] font-[family-name:var(--font-urbanist)]">
        {subtitle}
      </p>
    </Link>
  );
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error("[DashboardPage] Auth error:", authError.message);
  }
  
  // Fetch profile to get display name - use maybeSingle to handle missing profiles
  let displayName = userData?.user?.email?.split("@")[0] ?? "there";
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userData?.user?.id ?? "")
      .maybeSingle();
    
    if (profileError) {
      console.error("[DashboardPage] Profile fetch error:", profileError.message, profileError.code);
    } else if (profile?.display_name) {
      displayName = profile.display_name;
    }
  } catch (err) {
    console.error("[DashboardPage] Profile fetch exception:", err);
  }

  return (
    <div className="relative mt-[100px] flex min-h-full flex-col items-center justify-start text-[#2b2b2b]">
      {/* Greeting */}
      <h1 className="mt-8 font-inter text-lg font-medium text-[#2b2b2b]">
        Hey {displayName}, let&apos;s make some wishes happen!
      </h1>

      {/* List type cards */}
      <div className="relative mt-14 w-full max-w-6xl">
        <div className="mx-auto grid w-fit grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-5">
          <ListTypeCard title="Wishlist" subtitle="Birthday gifts, Christmas, etc." icon={<GiftIcon />} />
          <ListTypeCard title="Registry" subtitle="Weddings, baby showers & more" icon={<RegistryIcon />} />
          <ListTypeCard title="Personal" subtitle="Shopping list for personal use" icon={<DocumentIcon />} />
        </div>
      </div>

      {/* Popular gift ideas section */}
      <div className="mt-8 w-full flex justify-center">
        <PopularGiftIdeas />
      </div>

    </div>
  );
}
