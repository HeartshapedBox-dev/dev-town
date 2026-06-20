import { buildOfficeLayout } from "./office-map";
import { createMoveCommand, createMovePlan } from "./movement";

describe("createMovePlan", () => {
  it("separates the socket sessionId from the REST position payload", () => {
    const room = { id: "room-1", name: "Dev Town", inviteCode: "ABCD12", width: 20, height: 12 };
    const session = {
      id: "session-1",
      displayName: "Tester",
      avatarColor: "#2563eb",
      roomId: room.id,
      positionX: 0,
      positionY: 0,
      direction: "RIGHT" as const,
      status: "ONLINE" as const,
    };

    expect(createMoveCommand(session, "RIGHT", room)).toEqual({
      sessionId: session.id,
      roomId: room.id,
      positionX: 1,
      positionY: 0,
      direction: "RIGHT",
    });

    const plan = createMovePlan(session, room, "RIGHT", buildOfficeLayout(room.width, room.height));

    expect(plan.blocked).toBe(false);
    if (plan.blocked) {
      throw new Error("expected unblocked move plan");
    }

    expect(plan.updatePosition).toEqual({
      roomId: room.id,
      positionX: 1,
      positionY: 0,
      direction: "RIGHT",
    });
    expect(plan.socketPayload).toEqual({
      sessionId: session.id,
      roomId: room.id,
      positionX: 1,
      positionY: 0,
      direction: "RIGHT",
    });
    expect("sessionId" in plan.updatePosition).toBe(false);
  });

  it("blocks movement into furniture tiles", () => {
    const room = { id: "room-1", name: "Dev Town", inviteCode: "ABCD12", width: 20, height: 12 };
    const layout = buildOfficeLayout(room.width, room.height);
    const blockingItem = layout.furniture.find((item) => item.blocksMovement && item.x > 0) ?? layout.furniture[0];
    const session = {
      id: "session-1",
      displayName: "Tester",
      avatarColor: "#2563eb",
      roomId: room.id,
      positionX: Math.max(0, blockingItem.x - 1),
      positionY: blockingItem.y,
      direction: "RIGHT" as const,
      status: "ONLINE" as const,
    };

    const plan = createMovePlan(session, room, "RIGHT", layout);

    expect(plan.blocked).toBe(true);
    if (!plan.blocked) {
      throw new Error("expected blocked move plan");
    }

    expect(plan.message.length).toBeGreaterThan(0);
  });

  it("blocks movement into another online session tile", () => {
    const room = { id: "room-1", name: "Dev Town", inviteCode: "ABCD12", width: 20, height: 12 };
    const session = {
      id: "session-1",
      displayName: "Tester",
      avatarColor: "#2563eb",
      roomId: room.id,
      positionX: 8,
      positionY: 10,
      direction: "RIGHT" as const,
      status: "ONLINE" as const,
    };
    const otherSession = {
      id: "session-2",
      displayName: "Other",
      avatarColor: "#dc2626",
      roomId: room.id,
      positionX: 9,
      positionY: 10,
      direction: "LEFT" as const,
      status: "ONLINE" as const,
    };

    const plan = createMovePlan(session, room, "RIGHT", buildOfficeLayout(room.width, room.height), [
      session,
      otherSession,
    ]);

    expect(plan.blocked).toBe(true);
    if (!plan.blocked) {
      throw new Error("expected blocked move plan");
    }

    expect(plan.message).toBe("다른 사용자가 있어 이동할 수 없습니다");
  });

  it("allows movement into empty tiles", () => {
    const room = { id: "room-1", name: "Dev Town", inviteCode: "ABCD12", width: 20, height: 12 };
    const session = {
      id: "session-1",
      displayName: "Tester",
      avatarColor: "#2563eb",
      roomId: room.id,
      positionX: 0,
      positionY: 0,
      direction: "RIGHT" as const,
      status: "ONLINE" as const,
    };

    const plan = createMovePlan(session, room, "RIGHT", buildOfficeLayout(room.width, room.height), [session]);

    expect(plan.blocked).toBe(false);
    if (plan.blocked) {
      throw new Error("expected unblocked move plan");
    }
    expect(plan.session.positionX).toBe(1);
  });
});
