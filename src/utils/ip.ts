import {Address4, Address6} from "ip-address";

export function ipToBinary(ip: string): Buffer {
  let address: Address4 | Address6;

  if (ip.includes(":")) {
    address = new Address6(ip);
  } else {
    address = new Address4(ip);
  }

  return bigIntToBuffer(address.bigInt(), 16);
}

function bigIntToBuffer(bigint: bigint, byteLength: number): Buffer {
  const hex = bigint.toString(16).padStart(byteLength * 2, "0");
  return Buffer.from(hex, "hex");
}
