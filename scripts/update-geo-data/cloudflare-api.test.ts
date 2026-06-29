import { describe, it, expect, vi, beforeEach } from "vitest";
import { pollImportStatus, type PollFn } from "./cloudflare-api";

// Make `sleep` a no-op so tests run instantly.
vi.mock("./utils", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

describe("pollImportStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when the first poll returns status 'complete'", async () => {
    const poll: PollFn = vi
      .fn()
      .mockResolvedValueOnce({ success: true, status: "complete" });

    await expect(pollImportStatus("bm", poll)).resolves.toBeUndefined();
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("keeps polling while success is true and resolves on status 'complete'", async () => {
    const poll: PollFn = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true, status: "complete" });

    await expect(pollImportStatus("bm", poll)).resolves.toBeUndefined();
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("throws on an explicit import failure error", async () => {
    const poll: PollFn = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({
        success: false,
        error: "SQL execution error: table not found",
        status: "error",
        result: { rows_read: 0, rows_written: 0 },
      });

    await expect(pollImportStatus("bm", poll)).rejects.toThrow(
      "Import failed: SQL execution error: table not found",
    );
  });

  it("resolves when 'Not currently importing anything.' is received after active polling (race-condition fix)", async () => {
    const poll: PollFn = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({
        success: false,
        error: "Not currently importing anything.",
      });

    await expect(pollImportStatus("bm", poll)).resolves.toBeUndefined();
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("resolves when 'Not currently importing anything.' is the very first response (import completed before first poll)", async () => {
    const poll: PollFn = vi.fn().mockResolvedValueOnce({
      success: false,
      error: "Not currently importing anything.",
    });

    await expect(pollImportStatus("bm", poll)).resolves.toBeUndefined();
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("throws a timeout error after MAX_POLL_ATTEMPTS without a terminal state", async () => {
    const poll: PollFn = vi.fn().mockResolvedValue({ success: true });

    await expect(pollImportStatus("bm", poll)).rejects.toThrow(
      "Import polling timed out after 120 attempts",
    );
    // 120 attempts is the current MAX_POLL_ATTEMPTS value.
    expect(poll).toHaveBeenCalledTimes(120);
  });
});
