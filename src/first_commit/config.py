"""Shared configuration for the research prototype."""

from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

CLUSTER_TIME_WINDOW_HOURS = 48
MAX_ENTRIES_PER_SOURCE = 50


@dataclass(frozen=True)
class PrototypeConfig:
    """Runtime settings kept together so experiments are reproducible."""

    cluster_time_window_hours: int = CLUSTER_TIME_WINDOW_HOURS
    max_entries_per_source: int = MAX_ENTRIES_PER_SOURCE
    feed_workers: int = 8
