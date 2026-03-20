const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;
const GEN: [number, number, number, number, number] = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i] as number;
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const result: number[] = [];
  for (const c of hrp) result.push(c.charCodeAt(0) >> 5);
  result.push(0);
  for (const c of hrp) result.push(c.charCodeAt(0) & 31);
  return result;
}

function fromWords(words: number[]): Uint8Array {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  for (const word of words) {
    acc = (acc << 5) | word;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      result.push((acc >> bits) & 0xff);
    }
  }
  return new Uint8Array(result);
}

export function decodeBech32m(str: string): { hrp: string; data: Uint8Array } {
  const pos = str.lastIndexOf('1');
  if (pos < 1 || pos + 7 > str.length) throw new Error('Invalid bech32m string');

  const hrp = str.slice(0, pos).toLowerCase();
  const dataStr = str.slice(pos + 1);

  const values: number[] = [];
  for (const c of dataStr) {
    const idx = CHARSET.indexOf(c.toLowerCase());
    if (idx === -1) throw new Error(`Invalid bech32m character: ${c}`);
    values.push(idx);
  }

  if (polymod([...hrpExpand(hrp), ...values]) !== BECH32M_CONST) throw new Error('Invalid bech32m checksum');

  return { hrp, data: fromWords(values.slice(0, -6)) };
}
