import { TownClient } from "@/components/town-client";

type TownPageProps = {
  searchParams?: {
    roomId?: string;
    sessionId?: string;
  };
};

export default function TownPage({ searchParams }: TownPageProps) {
  const params = searchParams ?? {};
  return (
    <TownClient
      initialRoomId={params.roomId}
      initialSessionId={params.sessionId}
    />
  );
}
