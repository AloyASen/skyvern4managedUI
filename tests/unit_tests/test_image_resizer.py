"""Tests for :mod:`skyvern.utils.image_resizer` without importing the full package."""

from importlib import util
from pathlib import Path

module_path = Path(__file__).resolve().parents[2] / "skyvern" / "utils" / "image_resizer.py"
spec = util.spec_from_file_location("image_resizer", module_path)
image_resizer = util.module_from_spec(spec)
assert spec.loader is not None  # for type checkers
spec.loader.exec_module(image_resizer)

Resolution = image_resizer.Resolution
scale_coordinates = image_resizer.scale_coordinates


def test_scale_coordinates_rounds_to_nearest_int() -> None:
    """Coordinates should be rounded when scaling between resolutions."""
    current_dim = Resolution(width=300, height=300)
    target_dim = Resolution(width=200, height=200)
    # 199 * 200 / 300 = 132.666... which should round to 133
    assert scale_coordinates((199, 199), current_dim, target_dim) == (133, 133)
