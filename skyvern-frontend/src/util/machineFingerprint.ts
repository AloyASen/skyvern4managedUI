/* eslint-env node */
import os from "os";
import crypto from "crypto";
import { execSync } from "child_process";

function getMac(): string {
  const interfaces = os.networkInterfaces();
  for (const key of Object.keys(interfaces)) {
    const iface = interfaces[key];
    if (!iface) continue;
    for (const info of iface) {
      if (info.mac && info.mac !== "00:00:00:00:00:00") {
        return info.mac;
      }
    }
  }
  return "unknown-mac";
}

function getCpuId(): string {
  try {
    const platform = os.platform();
    if (platform === "win32") {
      const result = execSync("wmic cpu get ProcessorId").toString();
      return result.split("\n")[1].trim();
    }
    if (platform === "linux") {
      const result = execSync("cat /proc/cpuinfo | grep Serial").toString();
      return result.split(":")[1].trim();
    }
    if (platform === "darwin") {
      const result = execSync("sysctl -n machdep.cpu.brand_string").toString();
      return result.trim();
    }
  } catch {
    /* empty */
  }
  return "unknown-cpu";
}

function getDiskSerial(): string {
  try {
    const platform = os.platform();
    if (platform === "win32") {
      const result = execSync("wmic diskdrive get SerialNumber").toString();
      return result.split("\n")[1].trim();
    }
    if (platform === "linux") {
      const result = execSync(
        "hdparm -I /dev/sda | grep 'Serial Number'",
      ).toString();
      return result.split(":")[1].trim();
    }
    if (platform === "darwin") {
      const result = execSync(
        "system_profiler SPStorageDataType | grep 'Serial Number'",
      ).toString();
      return result.split(":")[1].trim();
    }
  } catch {
    /* empty */
  }
  return "unknown-disk";
}

export function generateMachineId(): string {
  const components = [
    getMac(),
    getCpuId(),
    getDiskSerial(),
    os.platform(),
    os.hostname(),
  ];
  const raw = components.join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}
