import requests
from behave import given, when, then

BASE_URL = "http://127.0.0.1:8000"


@given('a valid checkout payload for user "{user_id}"')
def step_valid_checkout_payload(context, user_id):
    context.payload = {
        "user_id": user_id,
        "currency": "KES",
        "amount": 1500,
        "environment": "production",
    }


@given('a checkout payload without a user_id')
def step_checkout_without_user_id(context):
    context.payload = {
        "currency": "KES",
        "amount": 1500,
        "environment": "production",
    }


@given('I have sent {count:d} checkout requests for user "{user_id}"')
def step_send_many_checkouts(context, count, user_id):
    context.last_status = None
    for _ in range(count):
        resp = requests.post(
            f"{BASE_URL}/api/v1/checkout",
            json={"user_id": user_id, "currency": "KES", "amount": 1500, "environment": "production"},
            timeout=5,
        )
        context.last_status = resp.status_code


@given('a ticket payload with category "{category}"')
@given('a ticket payload containing PII "{pii}" in the description')
def step_ticket_payload(context, category=None, pii=None):
    description = pii or "general support request"
    context.payload = {
        "user_id": "ticket_user_1",
        "category": category or "general",
        "description": description,
        "priority": "normal",
    }


@when('I POST the payload to "{endpoint}"')
@when('I POST the ticket to "{endpoint}"')
def step_post_payload(context, endpoint):
    context.response = requests.post(
        f"{BASE_URL}{endpoint}", json=context.payload, timeout=10
    )


@when('I send one more checkout request for user "{user_id}"')
def step_send_one_more(context, user_id):
    context.response = requests.post(
        f"{BASE_URL}/api/v1/checkout",
        json={"user_id": user_id, "currency": "KES", "amount": 1500, "environment": "production"},
        timeout=10,
    )


@then('the response status should be {status:d}')
def step_check_status(context, status):
    assert context.response.status_code == status, (
        f"expected {status}, got {context.response.status_code}: {context.response.text}"
    )


@then('the response should contain status "success"')
def step_check_success(context):
    body = context.response.json()
    assert body.get("status") == "success", body


@then('the route_email should contain "{text}"')
def step_check_route_email(context, text):
    body = context.response.json()
    assert text in body.get("route_email", ""), body


@then('the ticket_id should not be empty')
def step_check_ticket_id(context):
    body = context.response.json()
    assert body.get("ticket_id"), body
