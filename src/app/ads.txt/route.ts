import { readSiteOverrides } from "@/lib/admin/site-overrides";

export function GET() {
  const google = readSiteOverrides().google;
  const lines: string[] = [];
  if (google?.adsenseClient) {
    // google.com, pub-XXXX, DIRECT, f08c47fec0942fa0
    const pub = google.adsenseClient.replace(/^ca-/, "");
    lines.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  }
  if (google?.adsTxtExtra) {
    for (const line of google.adsTxtExtra.split("\n")) {
      const t = line.trim();
      if (t) lines.push(t);
    }
  }
  if (!lines.length) {
    lines.push("# Configure AdSense in /admin/site → Google");
  }
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
