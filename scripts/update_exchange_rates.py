#!/usr/bin/env python3
import json
import os
from datetime import datetime, timezone, timedelta
from urllib import parse, request


def main() -> None:
    api_url = os.environ.get("EXCHANGE_API_URL", "").strip()
    api_key = os.environ.get("EXCHANGE_API_KEY", "").strip()

    if not api_url:
      raise RuntimeError("Missing EXCHANGE_API_URL secret")
        raise RuntimeError("Missing EXCHANGE_API_URL secret")

    params = {}
    parsed_url = parse.urlsplit(api_url)
    query_params = dict(parse.parse_qsl(parsed_url.query, keep_blank_values=True))
    if api_key:
      params["access_key"] = api_key
        query_params["access_key"] = api_key

    url = f"{api_url}?{parse.urlencode(params)}" if params else api_url
    url = parse.urlunsplit(
        parsed_url._replace(query=parse.urlencode(query_params, doseq=True))
    )

    req = request.Request(url, headers={"User-Agent": "mjj-build-rate-updater/1.0"})
    with request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f"API request failed with status {resp.status}")
        payload = json.loads(resp.read().decode("utf-8"))

    rates = payload.get("rates")
    if not isinstance(rates, dict) or not rates:
        raise RuntimeError("Invalid API response: missing rates")

    bj_tz = timezone(timedelta(hours=8))
    stamp = datetime.now(bj_tz).strftime("%Y-%m-%d %H:%M GMT+8")

    output = {
        "date": stamp,
        "rates": rates,
    }

    with open("exchange_rates.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
