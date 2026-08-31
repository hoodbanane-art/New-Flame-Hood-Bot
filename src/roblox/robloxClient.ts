import { randomUUID } from "node:crypto";
import type { ParsedDuration } from "../utils/duration.js";
import type { ListRestrictionsResponse, RobloxUser } from "./types.js";

type RobloxClientOptions = {
  apiKey: string;
  messagingSharedSecret: string;
  universeId: string;
  fetchImpl?: typeof fetch;
};

type BanOptions = {
  userId: number;
  reason: string;
  duration: ParsedDuration;
  banAlts: boolean;
};

type PublishKickOptions = {
  topic: string;
  user: RobloxUser;
  reason: string;
  moderatorDiscordId: string;
};

export class RobloxApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(message);
    this.name = "RobloxApiError";
  }
}

export class RobloxClient {
  private readonly apiKey: string;
  private readonly messagingSharedSecret: string;
  private readonly universeId: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: RobloxClientOptions) {
    this.apiKey = options.apiKey;
    this.messagingSharedSecret = options.messagingSharedSecret;
    this.universeId = options.universeId;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async resolveUser(input: string): Promise<RobloxUser> {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      const user = await this.getUserById(Number(trimmed));
      if (!user) {
        throw new Error(`Roblox user ID ${trimmed} was not found.`);
      }
      return user;
    }

    const users = await this.getUsersByUsernames([trimmed]);
    const user = users[0];
    if (!user) {
      throw new Error(`Roblox username ${trimmed} was not found.`);
    }
    return user;
  }

  async getUserById(userId: number): Promise<RobloxUser | null> {
    const response = await this.fetchImpl("https://users.roblox.com/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userIds: [userId],
        excludeBannedUsers: false
      })
    });

    const json = await this.readJson<{ data?: RobloxUser[] }>(response);
    return json.data?.[0] ?? null;
  }

  async getUsersByUsernames(usernames: string[]): Promise<RobloxUser[]> {
    const response = await this.fetchImpl("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usernames,
        excludeBannedUsers: false
      })
    });

    const json = await this.readJson<{ data?: RobloxUser[] }>(response);
    return json.data ?? [];
  }

  async publishKick(options: PublishKickOptions): Promise<string> {
    const requestId = randomUUID();
    await this.openCloudRequest(
      `/cloud/v2/universes/${this.universeId}:publishMessage`,
      "POST",
      {
        topic: options.topic,
        message: JSON.stringify({
          version: 1,
          action: "kick",
          userId: options.user.id,
          username: options.user.name,
          reason: options.reason,
          moderatorDiscordId: options.moderatorDiscordId,
          requestId,
          issuedAt: new Date().toISOString(),
          sharedSecret: this.messagingSharedSecret
        })
      }
    );
    return requestId;
  }

  async banUser(options: BanOptions): Promise<void> {
    const gameJoinRestriction: Record<string, unknown> = {
      active: true,
      privateReason: options.reason,
      displayReason: options.reason,
      excludeAltAccounts: !options.banAlts
    };

    if (!options.duration.permanent && options.duration.robloxDuration) {
      gameJoinRestriction.duration = options.duration.robloxDuration;
    }

    await this.openCloudRequest(
      `/cloud/v2/universes/${this.universeId}/user-restrictions/${options.userId}?updateMask=game_join_restriction&idempotencyKey.key=${randomUUID()}&idempotencyKey.firstSent=${encodeURIComponent(new Date().toISOString())}`,
      "PATCH",
      {
        gameJoinRestriction
      }
    );
  }

  async unbanUser(userId: number, reason: string): Promise<void> {
    await this.openCloudRequest(
      `/cloud/v2/universes/${this.universeId}/user-restrictions/${userId}?updateMask=game_join_restriction&idempotencyKey.key=${randomUUID()}&idempotencyKey.firstSent=${encodeURIComponent(new Date().toISOString())}`,
      "PATCH",
      {
        gameJoinRestriction: {
          active: false,
          privateReason: reason,
          displayReason: reason
        }
      }
    );
  }

  async listActiveBans(pageToken?: string): Promise<ListRestrictionsResponse> {
    const query = new URLSearchParams();
    if (pageToken) {
      query.set("pageToken", pageToken);
    }

    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.openCloudRequest<ListRestrictionsResponse>(
      `/cloud/v2/universes/${this.universeId}/user-restrictions${suffix}`,
      "GET"
    );
  }

  async restartServers(): Promise<void> {
    await this.openCloudRequest(`/cloud/v2/universes/${this.universeId}:restartServers`, "POST", {});
  }

  private async openCloudRequest<T = unknown>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await this.fetchImpl(`https://apis.roblox.com${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return this.readJson<T>(response);
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!response.ok) {
      throw new RobloxApiError(`Roblox API request failed with HTTP ${response.status}.`, response.status, text);
    }

    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }
}
