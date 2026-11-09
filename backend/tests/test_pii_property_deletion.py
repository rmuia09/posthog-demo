import os
import time
from posthog import Posthog

POSTHOG_API_KEY = os.getenv("POSTHOG_API_KEY")
POSTHOG_HOST = os.getenv("POSTHOG_HOST", "https://us.i.posthog.com")

if not POSTHOG_API_KEY:
    print("ERROR: Set POSTHOG_API_KEY environment variable")
    exit(1)

posthog = Posthog(POSTHOG_API_KEY, host=POSTHOG_HOST)

TEST_USER_ID = "pii_delete_test_user"
TEST_PROPERTY = "pii_email"
TEST_VALUE = "delete_me@example.com"

print(f"Testing single-property deletion on PostHog project...")
print(f"User ID: {TEST_USER_ID}")
print(f"Property: {TEST_PROPERTY} = {TEST_VALUE}")
print()

# Step 1: Capture an event with the PII property as a person property
print("Step 1: Capturing event with PII person property...")
posthog.capture(
    TEST_USER_ID,
    "test_event",
    {
        "person_properties": {
            TEST_PROPERTY: TEST_VALUE,
        }
    },
)
print(f"  Captured: {TEST_PROPERTY} = {TEST_VALUE}")
print()

# Wait for ingestion
time.sleep(3)

# Step 2: Try to overwrite the property with empty string
print("Step 2: Overwriting property with empty string...")
posthog.capture(
    TEST_USER_ID,
    "test_event",
    {
        "person_properties": {
            TEST_PROPERTY: "",
        }
    },
)
print(f"  Overwrote: {TEST_PROPERTY} = ''")
print()

time.sleep(3)

# Step 3: Try to overwrite with None/null
print("Step 3: Overwriting property with None...")
posthog.capture(
    TEST_USER_ID,
    "test_event",
    {
        "person_properties": {
            TEST_PROPERTY: None,
        }
    },
)
print(f"  Overwrote: {TEST_PROPERTY} = None")
print()

time.sleep(3)

# Step 4: Check the person profile via PostHog's API
print("Step 4: Checking person profile via PostHog API...")
try:
    # Try to fetch the person - this depends on PostHog's API availability
    # posthog-python may not expose person lookup directly
    print("  posthog-python does not expose person profile lookup directly.")
    print("  Check PostHog UI → Persons → search for:", TEST_USER_ID)
    print("  Verify if", TEST_PROPERTY, "property still exists on the profile.")
except Exception as e:
    print(f"  Error: {e}")

print()
print("=" * 50)
print("MANUAL VERIFICATION REQUIRED:")
print("1. Go to PostHog → Persons → search for:", TEST_USER_ID)
print("2. Check if property", TEST_PROPERTY, "still exists")
print("3. If property is gone → single-property deletion works via empty/null overwrite")
print("4. If property remains → only whole-person deletion is supported")
print("=" * 50)