import hashlib
import platform
import subprocess
import uuid
from typing import List


def get_mac() -> str:
    """Return the device MAC address."""
    mac = uuid.getnode()
    return ":".join(f"{(mac >> ele) & 0xff:02x}" for ele in range(40, -1, -8))


def get_cpu_id() -> str:
    """Return a CPU identifier for the current platform."""
    try:
        system = platform.system()
        if system == "Windows":
            result = subprocess.check_output(["wmic", "cpu", "get", "ProcessorId"]).decode()
            return result.strip().split("\n")[1].strip()
        if system == "Linux":
            result = subprocess.check_output(
                "cat /proc/cpuinfo | grep Serial", shell=True
            ).decode()
            return result.strip().split(":")[1].strip()
        if system == "Darwin":
            result = subprocess.check_output(
                ["sysctl", "-n", "machdep.cpu.brand_string"]
            ).decode()
            return result.strip()
    except Exception:
        return "unknown-cpu"


def get_disk_serial() -> str:
    """Return the primary disk serial number."""
    try:
        system = platform.system()
        if system == "Windows":
            result = subprocess.check_output(["wmic", "diskdrive", "get", "SerialNumber"]).decode()
            lines = result.strip().split("\n")
            return lines[1].strip()
        if system == "Linux":
            result = subprocess.check_output(
                "sudo hdparm -I /dev/sda | grep 'Serial Number'", shell=True
            ).decode()
            return result.strip().split(":")[1].strip()
        if system == "Darwin":
            result = subprocess.check_output(
                "system_profiler SPStorageDataType | grep 'Serial Number'",
                shell=True,
            ).decode()
            return result.strip().split(":")[1].strip()
    except Exception:
        return "unknown-disk"


def generate_fingerprint() -> str:
    """Generate a SHA-256 fingerprint of hardware identifiers."""
    components: List[str] = [
        get_mac(),
        get_cpu_id(),
        get_disk_serial(),
        platform.system(),
        platform.node(),
    ]
    raw = "|".join(components)
    return hashlib.sha256(raw.encode()).hexdigest()


SYSTEM_FINGERPRINT = generate_fingerprint()
