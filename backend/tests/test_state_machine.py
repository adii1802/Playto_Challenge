"""
tests/test_state_machine.py
============================
Phase 1 required test: illegal transition via API returns 400
and the application status is unchanged.

Run:  python manage.py test tests.test_state_machine
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from kyc.models import KYCApplication, User
from kyc.state_machine import transition, SUBMITTED, UNDER_REVIEW, APPROVED, DRAFT


class IllegalTransitionTest(TestCase):
    """
    Attempt to transition an approved application back to draft via the API.
    Expect 400 and status unchanged.
    """

    def setUp(self):
        # Merchant
        self.merchant = User.objects.create_user(
            email="test_merchant@test.com",
            password="test123",
            role="merchant",
        )
        self.merchant_token = Token.objects.create(user=self.merchant)

        # Reviewer
        self.reviewer = User.objects.create_user(
            email="test_reviewer@test.com",
            password="test123",
            role="reviewer",
        )
        self.reviewer_token = Token.objects.create(user=self.reviewer)

        # Application in approved state
        self.app = KYCApplication.objects.create(merchant=self.merchant)
        transition(self.app, SUBMITTED)
        transition(self.app, UNDER_REVIEW)
        transition(self.app, APPROVED)

        self.client = APIClient()

    # ------------------------------------------------------------------
    # Test 1: approved → draft via submit endpoint (merchant)
    #   submit goes to SUBMITTED, not DRAFT, but approved → submitted
    #   is also illegal — so we test that too.
    # ------------------------------------------------------------------
    def test_approved_to_submitted_returns_400(self):
        """Approved → submitted is an illegal transition. Expect 400."""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.merchant_token.key}"
        )
        url = f"/api/v1/applications/{self.app.pk}/submit/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 400)

        # Status must not have changed
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, APPROVED)

    # ------------------------------------------------------------------
    # Test 2: State machine unit — approved → draft raises ValidationError
    # ------------------------------------------------------------------
    def test_state_machine_approved_to_draft_raises(self):
        """
        Direct call to transition(approved → draft) must raise
        django.core.exceptions.ValidationError with a clear message.
        """
        from django.core.exceptions import ValidationError

        app2 = KYCApplication.objects.create(merchant=self.merchant)
        transition(app2, SUBMITTED)
        transition(app2, UNDER_REVIEW)
        transition(app2, APPROVED)

        with self.assertRaises(ValidationError) as ctx:
            transition(app2, DRAFT)

        self.assertIn("Illegal transition", str(ctx.exception))

        # Status still approved
        app2.refresh_from_db()
        self.assertEqual(app2.status, APPROVED)

    # ------------------------------------------------------------------
    # Test 3: already-in-state check via state machine
    # ------------------------------------------------------------------
    def test_already_in_state_raises(self):
        """
        Calling transition(app, APPROVED) on an already-approved
        application must raise with 'already in state' message.
        """
        from django.core.exceptions import ValidationError

        app3 = KYCApplication.objects.create(merchant=self.merchant)
        transition(app3, SUBMITTED)
        transition(app3, UNDER_REVIEW)
        transition(app3, APPROVED)

        with self.assertRaises(ValidationError) as ctx:
            transition(app3, APPROVED)

        self.assertIn("already in state", str(ctx.exception))

    # ------------------------------------------------------------------
    # Test 4: reviewer cannot push approved → draft via approve endpoint
    # ------------------------------------------------------------------
    def test_reviewer_approve_already_approved_returns_400(self):
        """
        POST to /approve/ on an already-approved application must return 400
        (already in state) and leave status unchanged.
        """
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.reviewer_token.key}"
        )
        url = f"/api/v1/applications/{self.app.pk}/approve/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 400)
        self.assertIn("already in state", response.data.get("error", "").lower())

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, APPROVED)
