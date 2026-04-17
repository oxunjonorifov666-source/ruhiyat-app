/**
 * Expo Go telefonda 127.0.0.1 ni kompyuter deb qabul qilmaydi.
 * LAN IPv4 ni topib REACT_NATIVE_PACKAGER_HOSTNAME ga qo‘yadi.
 */
const os = require("os");
const { spawn } = require("child_process");
const path = require("path");

/** Expo CLI bilan bir xil `freeport-async` — Windows’da `net` bilan tekshiruv ba’zan yolg‘on “bo‘sh” beradi. */
const freePortAsync = require(require.resolve("freeport-async", {
  paths: [path.join(__dirname, "..")],
}));

async function pickFreeMetroPort(startPort) {
  const start = Number.isFinite(startPort) ? startPort : 8081;
  const metroPort = await freePortAsync(start, {
    hostnames: [null],
  });
  if (!metroPort) {
    throw new Error("[expo] Bo‘sh port topilmadi.");
  }
  return metroPort;
}

function pickLanIPv4() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const v4 = net.family === "IPv4" || net.family === 4;
      if (!v4 || net.internal) continue;
      const a = net.address;
      if (a.startsWith("169.254.")) continue;
      candidates.push(a);
    }
  }
  // Windows hotspot tarmog‘i 192.168.137.x — telefon shu subnetda bo‘lsa,
  // 172.16 kabi boshqa interfeysni tanlash ulanishni sindiradi.
  const on137 = candidates.filter((ip) => ip.startsWith("192.168.137."));
  if (on137.length === 1) return on137[0];
  if (on137.length > 1) {
    // Bir vaqtning o‘zida virtual hosted (.1) va Wi‑Fi klienti (.157) bo‘lishi mumkin;
    // Expo shu kompyuterga kelishi kerak — odatda .1 emas, DHCP bergan manzil.
    const notGateway = on137.find((ip) => ip !== "192.168.137.1");
    return notGateway ?? on137[0];
  }

  const score = (ip) => {
    if (ip.startsWith("172.")) return 3;
    if (ip.startsWith("192.168.")) return 2;
    if (ip.startsWith("10.")) return 1;
    return 0;
  };
  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0] || null;
}

// REACT_NATIVE_PACKAGER_HOSTNAME ni bu yerda o‘qimaymiz: Windows foydalanuvchi
// muhitida eski IP (masalan 172.16.x) qolib ketishi mumkin va avtouzatishni sindiradi.
// Qo‘lda: EXPO_PACKAGER_HOSTNAME yoki RUHIYAT_EXPO_LAN_HOST.
const host =
  process.env.EXPO_PACKAGER_HOSTNAME?.trim() ||
  process.env.RUHIYAT_EXPO_LAN_HOST?.trim() ||
  pickLanIPv4();
if (!host) {
  console.error(
    "[expo] Tarmoq IPv4 topilmadi. Wi‑Fi yoqilganini tekshiring yoki: pnpm run dev:tunnel",
  );
  process.exit(1);
}

console.log(`[expo] LAN manzil: ${host} (Expo Go shu IP orqali ulanadi)`);
console.log(
  "[expo] Expo Go: telefonda Play Store / App Store → “Expo Go” → “Scan QR code” (kompyuter va telefon bir Wi‑Fi da bo‘lsin).\n",
);

const env = {
  ...process.env,
  REACT_NATIVE_PACKAGER_HOSTNAME: host,
};

async function main() {
  const preferred = parseInt(process.env.EXPO_METRO_PORT || "8081", 10);
  const metroPort = await pickFreeMetroPort(preferred);
  if (metroPort !== preferred) {
    console.log(
      `[expo] Port ${preferred} band — Metro ${metroPort} da ishga tushadi (Expo Go: exp://${host}:${metroPort})\n`,
    );
  }

  env.RCT_METRO_PORT = String(metroPort);
  env.EXPO_METRO_PORT = String(metroPort);

  const expoCli = require.resolve("expo/bin/cli");
  const args = [expoCli, "start", "--lan", "--port", String(metroPort)];
  // masalan: pnpm dev -- --clear
  args.push(...process.argv.slice(2));

  const child = spawn(process.execPath, args, {
    cwd: path.join(__dirname, ".."),
    env,
    stdio: "inherit",
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
