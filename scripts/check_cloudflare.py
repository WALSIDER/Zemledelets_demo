"""Integration checks. Run only against a local/test D1 database."""
import concurrent.futures
import json
import sys
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8788"


def call(path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers=headers)
    try:
        with urlopen(req, timeout=30) as response:
            raw = response.read()
            return response.status, json.loads(raw) if "/api/" in path else raw
    except HTTPError as error:
        return error.code, json.loads(error.read())


state_file = Path(__file__).resolve().parent.parent / '.test-state.json'
if '--verify-persistence' in sys.argv:
    saved = json.loads(state_file.read_text(encoding='utf-8'))
    for account in saved:
        assert call('/api/auth/me', token=account['token'])[1]['user']['email'] == account['email']
    print('D1 persistence check passed after restart.')
    sys.exit(0)


for page in ["/", "/marketplace.html", "/companies.html", "/company-card.html",
             "/tenders.html", "/listing-detail.html", "/news.html", "/news-detail.html",
             "/events.html", "/auth.html", "/profile.html", "/marketplace",
             "/partials/header.html", "/partials/footer.html", "/assets/js/app.js"]:
    assert call(page)[0] == 200, page

for endpoint in ["bootstrap", "marketplace", "companies", "tenders", "news", "events"]:
    status, data = call("/api/" + endpoint)
    assert status == 200, (endpoint, status, data)

items = call("/api/marketplace")[1]["items"]
assert call("/api/marketplace/" + items[0]["id"])[1]["item"]["company"]
companies = call("/api/companies")[1]["items"]
assert call("/api/companies/" + companies[0]["slug"])[0] == 200
assert call("/api/profile")[0] == 401
assert call("/api/auth/me")[0] == 401
assert call("/api/unknown")[0] == 404
assert call("/api/auth/register", {})[0] == 400
assert call("/api/news/sync", {"limit": 1})[0] in [403, 503]


def register(index):
    email = f"cloudflare-test-{uuid.uuid4().hex}@example.invalid"
    password = uuid.uuid4().hex
    body = {"companyName": f"Cloudflare test {index}", "email": email,
            "password": password, "description": "Integration test company"}
    for attempt in range(8):
        status, result = call("/api/auth/register", body)
        if status == 409 and "user" not in result:
            time.sleep(0.1 * (attempt + 1))
            continue
        assert status == 201, (status, result)
        return email, password, result
    raise AssertionError("Repeated database conflicts")


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    accounts = list(pool.map(register, range(3)))

for email, password, result in accounts:
    token = result["token"]
    assert call("/api/auth/me", token=token)[1]["user"]["email"] == email
    assert call("/api/profile", token=token)[0] == 200
    assert call("/api/auth/login", {"email": email, "password": "wrong"})[0] == 401
    assert call("/api/auth/login", {"email": email, "password": password})[0] == 200
    assert call("/api/subscribe", {"email": email})[0] == 201
    assert call("/api/subscribe", {"email": email})[0] == 200
    assert call("/api/auth/register", {"companyName": "Duplicate", "email": email,
                                      "password": password, "description": "Duplicate"})[0] == 409

public_data = call("/api/companies")[1]
assert all(any(c["email"] == email for c in public_data["items"]) for email, _, _ in accounts)
assert not any(key in json.dumps(public_data) for key in ["passwordHash", "passwordSalt", '"token"'])
state_file.write_text(json.dumps([{'email': email, 'token': result['token']}
                                  for email, _, result in accounts]), encoding='utf-8')
print("Cloudflare checks passed: pages, API, auth, profile, subscriptions, concurrent writes.")
