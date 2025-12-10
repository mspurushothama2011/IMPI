"""
End-to-end backend test script for IMIP
- Reads a transcript from a file (or --text)
- Calls /summarize with meeting context
- Prints summary and top action items
- Optionally saves the meeting via /save

Usage examples:
  python tools/test_backend_e2e.py --file data/transcripts/one_hour_meeting.txt --attendees "John,Sarah,Mike,Lisa" --title "One-hour meeting" --save
  python tools/test_backend_e2e.py --text "short transcript..." --attendees "Alice,Bob" 
"""
import argparse
import datetime as dt
import json
import os
import sys
from typing import Optional

import requests

API_ROOT = os.getenv("API_ROOT", "http://localhost:8000")


def read_text(file: Optional[str], text: Optional[str]) -> str:
    if text:
        return text
    if not file:
        raise SystemExit("Provide --file or --text")
    with open(file, "r", encoding="utf-8") as f:
        return f.read()


def post_summarize(payload: dict) -> dict:
    url = f"{API_ROOT}/summarize"
    r = requests.post(url, data=payload, timeout=300)
    r.raise_for_status()
    return r.json()


def post_save(payload: dict) -> dict:
    url = f"{API_ROOT}/save"
    r = requests.post(url, data=payload, timeout=120)
    r.raise_for_status()
    return r.json()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", help="Path to transcript text file")
    ap.add_argument("--text", help="Raw transcript text")
    ap.add_argument("--attendees", help="Comma-separated attendees list", default=None)
    ap.add_argument("--meeting-date", help="ISO datetime for meeting", default=None)
    ap.add_argument("--title", help="Meeting title (when saving)", default="Scripted Meeting")
    ap.add_argument("--save", action="store_true", help="Save meeting after summarization")
    ap.add_argument("--print-json", action="store_true", help="Print raw JSON response")
    args = ap.parse_args()

    transcript = read_text(args.file, args.text)

    meeting_date = args.meeting_date or dt.datetime.now().isoformat()
    attendees = args.attendees

    summarize_payload = {
        "text": transcript,
        "meeting_date": meeting_date,
    }
    if attendees:
        summarize_payload["attendees"] = attendees

    print(f"Posting /summarize to {API_ROOT} ...")
    resp = post_summarize(summarize_payload)

    if args.print_json:
        print(json.dumps(resp, indent=2))

    summary = resp.get("summary", "")
    action_items = resp.get("action_items", [])
    print("\n=== SUMMARY ===\n")
    print(summary[:1200] + ("..." if len(summary) > 1200 else ""))

    print("\n=== ACTION ITEMS (top 10) ===\n")
    for i, item in enumerate(action_items[:10], 1):
        line = f"{i}. {item.get('text')}"
        owner = item.get("assignee") or item.get("owner")
        deadline = item.get("deadline") or item.get("due_date_iso")
        if owner:
            line += f" | Owner: {owner}"
        if deadline:
            line += f" | Due: {deadline}"
        print(line)

    if args.save:
        save_payload = {
            "title": args.title,
            "transcript": transcript,
            "summary": summary,
        }
        # pass context for server-side extraction (if implemented)
        if attendees:
            save_payload["attendees"] = attendees
        save_payload["meeting_date"] = meeting_date

        print("\nSaving meeting via /save ...")
        save_resp = post_save(save_payload)
        print(f"Saved meeting id: {save_resp.get('id')}")


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print(f"HTTP error: {e}\nBody: {e.response.text if e.response is not None else ''}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
