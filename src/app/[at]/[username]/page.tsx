import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ at: string; username: string }>;
};

export default async function AtAliasPage({ params }: PageProps): Promise<never> {
  const { at, username } = await params;
  if (at !== "@") {
    notFound();
  }

  redirect(`/%40/${encodeURIComponent(username)}`);
}
