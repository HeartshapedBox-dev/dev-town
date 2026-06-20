import { TownClient } from "@/components/town-client";

type TownPageProps = {
  searchParams?: Promise<{
    roomId?: string;
    sessionId?: string;
  }>;
};

export default async function TownPage({ searchParams }: TownPageProps) {
  const params = (await searchParams) ?? {};
  return (
    <TownClient
      initialRoomId={params.roomId}
      initialSessionId={params.sessionId}
    />
  );
}
