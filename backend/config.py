import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the sales-assistant directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

NOTION_API_KEY = ("NOTION_API_KEY")
NOTION_API_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"

# Database IDs
PROSPECTS_DB_ID = ""
DEALS_DB_ID = ""
ACTIVITIES_DB_ID = "
