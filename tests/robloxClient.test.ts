import { describe, expect, it, vi } from "vitest";
import { RobloxClient } from "../src/roblox/robloxClient.js";
import { parseDuration } from "../src/utils/duration.js";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init
  });
}

describe("RobloxClient", () => {
  it("resolves usernames with the Roblox users API", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [{ id: 1, name: "Builderman" }] }));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const client = new RobloxClient({ apiKey: "key", messagingSharedSecret: "a".repeat(32), universeId: "123", fetchImpl });

    await expect(client.resolveUser("Builderman")).resolves.toMatchObject({ id: 1, name: "Builderman" });
    expect(fetchMock).toHaveBeenCalledWith("https://users.roblox.com/v1/usernames/users", expect.objectContaining({ method: "POST" }));
  });

  it("publishes kick messages to Open Cloud", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const client = new RobloxClient({ apiKey: "key", messagingSharedSecret: "a".repeat(32), universeId: "123", fetchImpl });

    await client.publishKick({
      topic: "DiscordModeration",
      user: { id: 1, name: "Builderman" },
      reason: "Testing",
      moderatorDiscordId: "999"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://apis.roblox.com/cloud/v2/universes/123:publishMessage",
      expect.objectContaining({ method: "POST" })
    );

    const [, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const payload = JSON.parse(String(request.body));
    const message = JSON.parse(payload.message);
    expect(message).toMatchObject({
      version: 1,
      action: "kick",
      userId: 1,
      moderatorDiscordId: "999",
      sharedSecret: "a".repeat(32)
    });
    expect(message.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(message.issuedAt).toEqual(expect.any(String));
  });

  it("maps banalts true to excludeAltAccounts false", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const client = new RobloxClient({ apiKey: "key", messagingSharedSecret: "a".repeat(32), universeId: "123", fetchImpl });

    await client.banUser({
      userId: 1,
      reason: "Testing",
      duration: parseDuration("1d"),
      banAlts: true
    });

    const [url, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("updateMask=game_join_restriction");
    expect(JSON.parse(String(request.body))).toMatchObject({
      gameJoinRestriction: {
        active: true,
        duration: "86400s",
        excludeAltAccounts: false
      }
    });
  });

  it("omits duration for permanent bans", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const client = new RobloxClient({ apiKey: "key", messagingSharedSecret: "a".repeat(32), universeId: "123", fetchImpl });

    await client.banUser({
      userId: 1,
      reason: "Testing",
      duration: parseDuration("permanent"),
      banAlts: false
    });

    const [url, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("updateMask=game_join_restriction");
    expect(JSON.parse(String(request.body)).gameJoinRestriction).not.toHaveProperty("duration");
  });
});
