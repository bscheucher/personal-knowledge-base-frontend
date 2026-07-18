import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SseParser } from "./sseParser.ts";

const bytes = (value: string) => new TextEncoder().encode(value);

describe("SseParser", () => {
  it("handles fragmented CRLF frames, comments, and multiline data", () => {
    const parser = new SseParser();
    assert.deepEqual(parser.push(bytes(": keepalive\r\nevent: token\r\ndata: {\"text\":\r")), []);
    assert.deepEqual(parser.push(bytes("\ndata: \"hello\"}\r\n\r\n")), [
      { event: "token", data: '{"text":\n"hello"}' },
    ]);
  });

  it("preserves Unicode split across byte chunks and leading token spaces", () => {
    const parser = new SseParser();
    const input = bytes('event: token\ndata: {"text":" ÖIF"}\n\n');
    const split = input.indexOf(0xc3) + 1;
    assert.deepEqual(parser.push(input.slice(0, split)), []);
    assert.deepEqual(parser.push(input.slice(split)), [
      { event: "token", data: '{"text":" ÖIF"}' },
    ]);
  });

  it("flushes a final frame without a trailing blank line", () => {
    const parser = new SseParser();
    parser.push(bytes('event: done\ndata: {"status":"complete"}'));
    assert.deepEqual(parser.finish(), [
      { event: "done", data: '{"status":"complete"}' },
    ]);
  });

  it("parses terminal error events", () => {
    const parser = new SseParser();
    assert.deepEqual(parser.push(bytes('event: error\ndata: {"status":"interrupted"}\n\n')), [
      { event: "error", data: '{"status":"interrupted"}' },
    ]);
  });
});
