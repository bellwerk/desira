"use client";

import { useState, useEffect, useCallback } from "react";
import { generateInviteLink, listInvites, revokeInvite, getListMembers, removeMember } from "../../actions";
import type { InviteRecord, MemberRecord } from "../../actions";

type InvitesSectionProps = {
  listId: string;
  baseUrl: string;
};

export function InvitesSection({ listId, baseUrl }: InvitesSectionProps): React.ReactElement {
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const [invitesResult, membersResult] = await Promise.all([
      listInvites(listId),
      getListMembers(listId),
    ]);

    if (invitesResult.success) {
      setInvites(invitesResult.data as InviteRecord[]);
    }
    if (membersResult.success) {
      setMembers(membersResult.data as MemberRecord[]);
    }
    
    setIsLoading(false);
  }, [listId]);

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, [loadData]);

  async function handleGenerateLink(): Promise<void> {
    setIsGenerating(true);
    setError(null);
    setNewInviteLink(null);

    const result = await generateInviteLink(listId);

    if (result.success) {
      const { inviteToken } = result.data as { inviteToken: string };
      const link = `${baseUrl}/app/invite/${inviteToken}`;
      setNewInviteLink(link);
      await loadData();
    } else {
      setError(result.error ?? "Failed to generate invite link");
    }

    setIsGenerating(false);
  }

  async function handleCopyLink(): Promise<void> {
    if (!newInviteLink) return;
    
    try {
      await navigator.clipboard.writeText(newInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  }

  async function handleRevokeInvite(inviteId: string): Promise<void> {
    const confirmed = window.confirm("Are you sure you want to revoke this invite?");
    if (!confirmed) return;

    const result = await revokeInvite(inviteId);
    if (result.success) {
      await loadData();
      if (newInviteLink) {
        // Clear the new invite link display if the revoked invite was the new one
        setNewInviteLink(null);
      }
    } else {
      setError(result.error ?? "Failed to revoke invite");
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName || "this member"} from the list?`
    );
    if (!confirmed) return;

    const result = await removeMember(memberId);
    if (result.success) {
      await loadData();
    } else {
      setError(result.error ?? "Failed to remove member");
    }
  }

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const nonOwnerMembers = members.filter((m) => m.role !== "owner");

  return (
    <div className="mt-8 space-y-6">
      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Team Members
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Invite others to collaborate on this list.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Generate invite link */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Generate invite link
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Create a one-time link to invite someone to this list.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-rose-600 hover:to-orange-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 0 0-6.364 0l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
                Generate link
              </>
            )}
          </button>
        </div>

        {/* New invite link display */}
        {newInviteLink && (
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {newInviteLink}
            </code>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* Current members */}
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
          Members ({nonOwnerMembers.length})
        </h3>
        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ) : nonOwnerMembers.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No members yet. Generate an invite link to add people.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
            {nonOwnerMembers.map((member) => {
              const displayName =
                (member.profiles as { display_name: string | null } | null)?.display_name ??
                "Unknown member";
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <svg
                        className="h-4 w-4 text-slate-500 dark:text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id, displayName)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
            Pending invites ({pendingInvites.length})
          </h3>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <svg
                      className="h-4 w-4 text-amber-600 dark:text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Invite link
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Created {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyInviteButton
                    inviteToken={invite.invite_token}
                    baseUrl={baseUrl}
                  />
                  <button
                    type="button"
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CopyInviteButton({
  inviteToken,
  baseUrl,
}: {
  inviteToken: string;
  baseUrl: string;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    const link = `${baseUrl}/app/invite/${inviteToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

