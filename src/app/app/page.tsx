import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui";

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
      className="group relative flex h-[300px] w-[230px] flex-col items-center justify-center rounded-[30px] border-2 border-white/50 bg-[#d9d9d9]/70 pb-0 px-[21px] text-center shadow-[inset_2px_2px_4px_2px_#eaeaea] backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Title badge */}
      <div className="absolute top-5 mt-3.5 mb-3.5 rounded-full bg-white/70 px-6 py-2 text-center text-[#eaeaea]">
        <span className="font-asul text-lg font-semibold tracking-normal text-[#343338]">{title}</span>
      </div>
      
      {/* Icon */}
      <div className="mb-2.5 mt-15">{icon}</div>
      
      {/* Subtitle */}
      <p className="flex h-fit max-w-[10rem] flex-wrap justify-center text-center text-base leading-tight text-[#343338]">
        {subtitle}
      </p>
    </Link>
  );
}

interface GiftSuggestionCardProps {
  name: string;
  price: string;
  imageUrl?: string | null;
  favicon?: string | null;
}

/**
 * GiftSuggestionCard — displays a gift suggestion with image, name, price, and favicon
 * Used in the "Popular gift ideas" section on the dashboard
 */
function GiftSuggestionCard({ name, price, imageUrl, favicon }: GiftSuggestionCardProps): React.ReactElement {
  return (
    <div className="group relative flex-shrink-0 w-[106px] h-[140px] rounded-[15px] bg-[#2b2b2b]/15 p-1.5 font-inter">
      {/* Add button */}
      <button className="absolute right-2.5 top-2.5 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-[#2b2b2b] shadow-md transition-transform hover:scale-110">
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      
      {/* Product image */}
      <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 mb-0.5 overflow-hidden">
        {imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      
      {/* Info */}
      <p className="text-xs font-inter font-medium text-[#2b2b2b] truncate">{name}</p>
      <div className="flex items-center gap-0.5 leading-3 font-inter">
        {favicon ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={favicon}
            alt=""
            className="h-3.5 w-3.5 shrink-0 rounded-sm"
            onError={(e) => {
              // Hide favicon on error
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-xs text-[#62748e]" aria-hidden="true">·</span>
        )}
        <span className="text-[11px] text-[#2b2b2b]">{price}</span>
      </div>
    </div>
  );
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  // Fetch profile to get display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userData?.user?.id ?? "")
    .single();
  
  const displayName = profile?.display_name ?? userData?.user?.email?.split("@")[0] ?? "there";

  return (
    <div className="relative flex min-h-full flex-col items-center justify-start text-[#2b2b2b]">
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
      <GlassCard className="mt-8 w-full max-w-[740px] py-3">
        <div className="flex items-center justify-between mb-2 text-[#2b2b2b]">
          <span className="text-sm text-[#2b2b2b]">Popular gift ideas</span>
          <button className="text-xs font-medium text-[#2b2b2b] hover:text-[#2b2b2b]/70">
            Explore All
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 font-inter">
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
          <GiftSuggestionCard name="Nike Sport Shoes for wi..." price="CA$15.99" />
        </div>
      </GlassCard>

    </div>
  );
}
