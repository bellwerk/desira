import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "../SignOutButton";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

export default async function SettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      {/* Hero Header - Simplified, no card needed */}
      <div className="pt-8 pb-6">
        <h1 
          className="text-[32px] font-bold leading-tight tracking-tight" 
          style={{ fontFamily: "Asul", color: "rgba(43, 43, 43, 1)" }}
        >
          Settings
        </h1>
        <p 
          className="mt-2 leading-relaxed" 
          style={{ 
            color: "rgba(43, 43, 43, 1)", 
            fontFamily: "Urbanist", 
            fontWeight: 600, 
            fontSize: "16px" 
          }}
        >
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Card - Enhanced with better visual hierarchy */}
      <div className="rounded-[24px] bg-[#2b2b2b] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/[0.05] backdrop-blur-xl">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-white tracking-tight">Profile</h2>
        </div>

        {/* Email Field - Refined with better spacing */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-white/40 uppercase tracking-wide">
            Email Address
          </label>
          <div className="group relative">
            <div className="rounded-[14px] bg-[#1a1a1a] px-4 py-3.5 text-[15px] text-white/90 border border-white/[0.03] transition-all duration-200 group-hover:border-white/[0.08]">
              {user?.email ?? "—"}
            </div>
            {/* Subtle verified badge */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] font-medium">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section - Functional design */}
      <div className="rounded-[24px] bg-[#2b2b2b] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/[0.05] backdrop-blur-xl">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-semibold text-white tracking-tight">Preferences</h2>
            <p className="text-[13px] text-white/40 mt-0.5">Customize your experience</p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-3">
          {/* Payment Setup */}
          <button className="group w-full flex items-center justify-between p-4 rounded-[14px] bg-[#1a1a1a] border border-white/[0.03] transition-all duration-200 hover:border-white/[0.08] hover:bg-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 transition-colors group-hover:bg-white/15">
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[14px] font-medium text-white">Payment Setup</p>
                <p className="text-[12px] text-white/50 mt-0.5">Connect Stripe for payouts</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/30 transition-all group-hover:text-white/50 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Notifications */}
          <button className="group w-full flex items-center justify-between p-4 rounded-[14px] bg-[#1a1a1a] border border-white/[0.03] transition-all duration-200 hover:border-white/[0.08] hover:bg-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 transition-colors group-hover:bg-white/15">
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[14px] font-medium text-white">Notifications</p>
                <p className="text-[12px] text-white/50 mt-0.5">Manage alerts and preferences</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/30 transition-all group-hover:text-white/50 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Privacy & Data */}
          <button className="group w-full flex items-center justify-between p-4 rounded-[14px] bg-[#1a1a1a] border border-white/[0.03] transition-all duration-200 hover:border-white/[0.08] hover:bg-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 transition-colors group-hover:bg-white/15">
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[14px] font-medium text-white">Privacy & Data</p>
                <p className="text-[12px] text-white/50 mt-0.5">Control your information</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/30 transition-all group-hover:text-white/50 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Account Actions - Clean separation */}
      <div className="rounded-[24px] bg-[#2b2b2b] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/[0.05] backdrop-blur-xl">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-semibold text-white tracking-tight">Security</h2>
            <p className="text-[13px] text-white/40 mt-0.5">Manage your session</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <SignOutButton />
      </div>
    </div>
  );
}











