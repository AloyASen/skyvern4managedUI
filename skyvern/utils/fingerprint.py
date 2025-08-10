import hashlib
import platform
import subprocess
import uuid
from pathlib import Path
from typing import List


def get_mac() -> str:
    """Return the device MAC address."""
    mac = uuid.getnode()
    return ":".join(f"{(mac >> ele) & 0xFF:02x}" for ele in range(40, -1, -8))


def get_cpu_id() -> str:
    """Return a CPU identifier for the current platform.

    Notes:
        In containers, traditional identifiers can be unreliable. Prefer hardware
        UUID when available on Linux; otherwise fall back to platform-specific queries.
    """
    try:
        system = platform.system()
        if system == "Windows":
            result = subprocess.check_output(["wmic", "cpu", "get", "ProcessorId"]).decode()
            return result.strip().split("\n")[1].strip()
        if system == "Linux":
            # Prefer DMI product UUID if present (stable per machine)
            dmi = Path("/sys/class/dmi/id/product_uuid")
            if dmi.exists():
                return dmi.read_text().strip()
            # Fallback: try CPU brand string (less unique/stable)
            try:
                result = subprocess.check_output(["lscpu"]).decode()
                for line in result.splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        if k.strip().lower() == "model name":
                            return v.strip()
            except Exception:
                pass
            # Last resort: look for Serial in /proc/cpuinfo (often absent on x86)
            try:
                result = subprocess.check_output(
                    "cat /proc/cpuinfo | grep -i 'serial' | head -n1",
                    shell=True,
                ).decode()
                if ":" in result:
                    return result.strip().split(":", 1)[1].strip()
            except Exception:
                pass
            return "unknown-cpu"
        if system == "Darwin":
            result = subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"]).decode()
            return result.strip()
    except Exception:
        return "unknown-cpu"
    return "unknown-cpu"


def get_disk_serial() -> str:
    """Return the primary disk serial number.

    Note: In containerized environments, this may reflect virtual devices; best-effort only.
    """
    try:
        system = platform.system()
        if system == "Windows":
            result = subprocess.check_output(["wmic", "diskdrive", "get", "SerialNumber"]).decode()
            lines = [l.strip() for l in result.strip().splitlines() if l.strip()]
            return lines[1] if len(lines) > 1 else "unknown-disk"
        if system == "Linux":
            # Try lsblk to fetch serial in a container-safe way
            try:
                result = subprocess.check_output(["lsblk", "-ndo", "SERIAL", "/dev/sda"]).decode().strip()
                if result:
                    return result
            except Exception:
                pass
            try:
                result = subprocess.check_output(
                    "hdparm -I /dev/sda | grep -i 'Serial Number' | head -n1",
                    shell=True,
                ).decode()
                if ":" in result:
                    return result.strip().split(":", 1)[1].strip()
            except Exception:
                pass
            return "unknown-disk"
        if system == "Darwin":
            result = subprocess.check_output(
                "system_profiler SPStorageDataType | grep 'Serial Number' | head -n1",
                shell=True,
            ).decode()
            if ":" in result:
                return result.strip().split(":", 1)[1].strip()
    except Exception:
        return "unknown-disk"
    return "unknown-disk"


def generate_fingerprint() -> str:
    """Generate a SHA-256 fingerprint of hardware identifiers.

    Emphasizes stable, host-linked identifiers where possible.
    """
    components: List[str] = [
        get_cpu_id(),
        get_disk_serial(),
        get_mac(),
        platform.system(),
        platform.node(),
    ]
    raw = "|".join(components)
    return hashlib.sha256(raw.encode()).hexdigest()


SYSTEM_FINGERPRINT = generate_fingerprint()
