import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the sales-assistant directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_API_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"

# Database IDs
PROSPECTS_DB_ID = "343127b3-67ba-811a-9640-fe0ccbb652d1"
DEALS_DB_ID = "345127b3-67ba-81e5-a417-ffb2883767d2"
ACTIVITIES_DB_ID = "345127b3-67ba-81c9-bdc0-c23120658953"
