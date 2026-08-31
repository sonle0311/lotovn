import { describe, it, expect } from "vitest";
import {
    electHostUserId,
    shouldAcceptHostChange,
    isAuthorizedHostPayload,
} from "./host-logic";

describe("electHostUserId", () => {
    it("returns living host when present", () => {
        expect(
            electHostUserId([
                { id: "b", isHost: false },
                { id: "a", isHost: true },
            ])
        ).toBe("a");
    });

    it("elects lexicographically first id when no host", () => {
        expect(
            electHostUserId([
                { id: "mobi", isHost: false },
                { id: "alpha", isHost: false },
            ])
        ).toBe("alpha");
    });

    it("returns null for empty list", () => {
        expect(electHostUserId([])).toBeNull();
    });
});

describe("shouldAcceptHostChange", () => {
    it("rejects takeover while known host is still present", () => {
        expect(
            shouldAcceptHostChange(
                [
                    { id: "host-1", isHost: true },
                    { id: "attacker", isHost: false },
                ],
                "attacker",
                "host-1"
            )
        ).toBe(false);
    });

    it("accepts elected successor when known host left", () => {
        expect(
            shouldAcceptHostChange(
                [
                    { id: "beta", isHost: false },
                    { id: "alpha", isHost: false },
                ],
                "alpha",
                "host-gone"
            )
        ).toBe(true);
    });

    it("rejects non-elected nominee", () => {
        expect(
            shouldAcceptHostChange(
                [
                    { id: "beta", isHost: false },
                    { id: "alpha", isHost: false },
                ],
                "beta",
                null
            )
        ).toBe(false);
    });
});

describe("isAuthorizedHostPayload", () => {
    it("requires matching known host uid", () => {
        expect(isAuthorizedHostPayload("host-1", "host-1")).toBe(true);
        expect(isAuthorizedHostPayload("attacker", "host-1")).toBe(false);
        expect(isAuthorizedHostPayload("host-1", null)).toBe(false);
    });
});
