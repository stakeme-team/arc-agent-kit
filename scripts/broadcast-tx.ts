import { broadcastRaw } from "../src/rpc.js";

const hex = process.argv[2] || (await new Promise<string>((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    data += chunk;
  });
  process.stdin.on("end", () => resolve(data.trim()));
}));

if (!hex.startsWith("0x")) {
  console.error("Pass a signed 0x… hex as argv or stdin.");
  process.exit(1);
}

const hash = await broadcastRaw(hex as `0x${string}`);
console.log(hash);
console.log(`https://arc.exploreme.pro/tx/${hash}`);
