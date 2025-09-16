"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import QRCode from "react-qr-code"

type SecurityType = "WPA" | "WEP" | "nopass"

export default function Home() {
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [security, setSecurity] = useState<SecurityType>("WPA")
  const [hidden, setHidden] = useState(false)

  const qrContainerRef = useRef<HTMLDivElement | null>(null)

  const payload = useMemo(
    () => generateWifiPayload(security, ssid, password, hidden),
    [security, ssid, password, hidden]
  )

  function handleDownloadSvg() {
    const svg = qrContainerRef.current?.querySelector<SVGSVGElement>("svg")
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `wifi-qr-${ssid || "network"}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Wi‑Fi QR Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-3">
              <label className="text-sm">SSID</label>
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Network name"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />

              <label className="text-sm mt-2">Security</label>
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={security}
                onChange={(e) => setSecurity(e.target.value as SecurityType)}
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open (no password)</option>
              </select>

              <label className="text-sm mt-2">Password</label>
              <input
                className="h-10 rounded-md border bg-background px-3 disabled:opacity-60"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={security === "nopass"}
              />

              <label className="flex items-center gap-2 mt-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                />
                Hidden network
              </label>
            </div>

            <div className="flex items-center justify-center p-4 bg-accent/50 rounded-lg">
              <div ref={qrContainerRef} className="bg-white p-3 rounded-md">
                <QRCode value={payload || " "} size={192} />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 justify-end">
          <Button
            onClick={handleDownloadSvg}
            disabled={!ssid || (security !== "nopass" && !password)}
          >
            Download SVG
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function escapeWifiText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:")
    .replace(/\"/g, '\\"')
}

function generateWifiPayload(
  type: SecurityType,
  ssid: string,
  password: string,
  hidden: boolean
): string {
  const S = escapeWifiText(ssid.trim())
  if (!S) return ""

  const T = type === "nopass" ? "nopass" : type
  const P = type === "nopass" ? "" : escapeWifiText(password)

  let data = `WIFI:T:${T};S:${S};`
  if (T !== "nopass") data += `P:${P};`
  if (hidden) data += `H:true;`
  data += ";"
  return data
}
