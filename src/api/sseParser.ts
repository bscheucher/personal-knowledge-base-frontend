export interface SseEvent {
  event: string;
  data: string;
}

/** Incrementally decodes a byte stream and emits complete SSE events. */
export class SseParser {
  private readonly decoder = new TextDecoder();
  private buffer = "";

  push(bytes: Uint8Array): SseEvent[] {
    this.buffer += this.decoder.decode(bytes, { stream: true });
    return this.readFrames(false);
  }

  finish(): SseEvent[] {
    this.buffer += this.decoder.decode();
    return this.readFrames(true);
  }

  private readFrames(flush: boolean): SseEvent[] {
    const events: SseEvent[] = [];
    const separator = /\r\n\r\n|\n\n|\r\r/;
    let match: RegExpExecArray | null;

    while ((match = separator.exec(this.buffer)) !== null) {
      const frame = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      const event = parseFrame(frame);
      if (event) events.push(event);
    }

    if (flush && this.buffer.length > 0) {
      const event = parseFrame(this.buffer);
      this.buffer = "";
      if (event) events.push(event);
    }
    return events;
  }
}

function parseFrame(frame: string): SseEvent | null {
  let event = "message";
  const data: string[] = [];

  for (const line of frame.split(/\r\n|\r|\n/)) {
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    // The optional framing space is not part of the field value (HTML SSE spec).
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "event") event = value;
    if (field === "data") data.push(value);
  }

  return data.length === 0 ? null : { event, data: data.join("\n") };
}
