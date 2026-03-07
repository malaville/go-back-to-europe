// ---------------------------------------------------------------------------
// Google Flights URL generator with date support
// Reverse-engineered from the protobuf-encoded `tfs` parameter.
// ---------------------------------------------------------------------------

/**
 * Build a protobuf-encoded Google Flights one-way search URL.
 * The `tfs` parameter is a base64url-encoded protobuf message.
 */
export function googleFlightsUrl(
  originCode: string,
  destCode: string,
  date?: string // YYYY-MM-DD
): string {
  if (!date) {
    // Fallback to simple query format (no date control)
    return `https://www.google.com/travel/flights?q=Flights+to+${destCode}+from+${originCode}+oneway&curr=EUR`;
  }

  const tfs = buildTfsParam(originCode, destCode, date);
  return `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=EgYIABAAGAA&curr=EUR`;
}

function buildTfsParam(origin: string, dest: string, date: string): string {
  const buf: number[] = [];

  // Field 1 (varint): 28
  writeVarintField(buf, 1, 28);
  // Field 2 (varint): 2 (one-way)
  writeVarintField(buf, 2, 2);

  // Field 3 (embedded message): flight segment
  const segment: number[] = [];
  // Field 2 (string): date
  writeStringField(segment, 2, date);
  // Field 13 (embedded message): origin airport
  const originMsg: number[] = [];
  writeVarintField(originMsg, 1, 1);
  writeStringField(originMsg, 2, origin);
  writeBytesField(segment, 13, originMsg);
  // Field 14 (embedded message): destination airport
  const destMsg: number[] = [];
  writeVarintField(destMsg, 1, 1);
  writeStringField(destMsg, 2, dest);
  writeBytesField(segment, 14, destMsg);

  writeBytesField(buf, 3, segment);

  // Field 8 (varint): 1
  writeVarintField(buf, 8, 1);
  // Field 9 (varint): 1
  writeVarintField(buf, 9, 1);
  // Field 14 (varint): 1
  writeVarintField(buf, 14, 1);

  // Field 16 (embedded message): filter with max-int
  const filter: number[] = [];
  // Field 1 (varint): max int64 (0x7FFFFFFFFFFFFFFF encoded as varint)
  filter.push(0x08); // field 1, varint
  filter.push(0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01);
  writeBytesField(buf, 16, filter);

  // Field 19 (varint): 2
  writeVarintField(buf, 19, 2);

  // Base64url encode (no padding, URL-safe)
  const bytes = new Uint8Array(buf);
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Protobuf helpers
function writeVarint(buf: number[], value: number) {
  while (value > 0x7F) {
    buf.push((value & 0x7F) | 0x80);
    value >>>= 7;
  }
  buf.push(value & 0x7F);
}

function writeVarintField(buf: number[], fieldNum: number, value: number) {
  writeVarint(buf, (fieldNum << 3) | 0); // wire type 0 = varint
  writeVarint(buf, value);
}

function writeStringField(buf: number[], fieldNum: number, str: string) {
  writeVarint(buf, (fieldNum << 3) | 2); // wire type 2 = length-delimited
  const encoded = new TextEncoder().encode(str);
  writeVarint(buf, encoded.length);
  buf.push(...encoded);
}

function writeBytesField(buf: number[], fieldNum: number, data: number[]) {
  writeVarint(buf, (fieldNum << 3) | 2); // wire type 2 = length-delimited
  writeVarint(buf, data.length);
  buf.push(...data);
}
