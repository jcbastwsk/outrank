import { ProfileRoom } from "../../../components/ProfileRoom";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string }>;
}) {
  const { fresh } = await searchParams;
  return <ProfileRoom fresh={fresh === "1"} />;
}
