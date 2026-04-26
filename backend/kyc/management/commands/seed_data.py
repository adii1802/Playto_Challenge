"""
kyc/management/commands/seed_data.py
=====================================
Management command: python manage.py seed_data

Creates:
  - merchant_a@test.com  (merchant) → draft application
  - merchant_b@test.com  (merchant) → application in under_review state
                                      with personal + business detail
  - reviewer@test.com    (reviewer) → no application

All state changes go through state_machine.transition(). ✅
No inline status assignments. ✅
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from kyc.models import (
    KYCApplication,
    KYCBusinessDetail,
    KYCPersonalDetail,
    User,
)
from kyc.state_machine import transition, SUBMITTED, UNDER_REVIEW


class Command(BaseCommand):
    help = "Seed the database with test users and KYC applications."

    def handle(self, *args, **options):
        with transaction.atomic():
            self._seed()
        self.stdout.write(self.style.SUCCESS("[OK] Seed data created successfully."))

    def _seed(self):
        # ------------------------------------------------------------------
        # Reviewer
        # ------------------------------------------------------------------
        reviewer, created = User.objects.get_or_create(
            email="reviewer@test.com",
            defaults={"role": "reviewer"},
        )
        if created:
            reviewer.set_password("test123")
            reviewer.save()
            self.stdout.write("  Created reviewer@test.com")
        else:
            self.stdout.write("  reviewer@test.com already exists — skipping")

        # ------------------------------------------------------------------
        # Merchant A — draft application
        # ------------------------------------------------------------------
        merchant_a, created = User.objects.get_or_create(
            email="merchant_a@test.com",
            defaults={"role": "merchant"},
        )
        if created:
            merchant_a.set_password("test123")
            merchant_a.save()
            self.stdout.write("  Created merchant_a@test.com")
        else:
            self.stdout.write("  merchant_a@test.com already exists — skipping")

        if not KYCApplication.objects.filter(merchant=merchant_a).exists():
            KYCApplication.objects.create(merchant=merchant_a)
            # Status remains "draft" — no transition needed
            self.stdout.write("  Created draft application for merchant_a")

        # ------------------------------------------------------------------
        # Merchant B — under_review application with details
        # ------------------------------------------------------------------
        merchant_b, created = User.objects.get_or_create(
            email="merchant_b@test.com",
            defaults={"role": "merchant"},
        )
        if created:
            merchant_b.set_password("test123")
            merchant_b.save()
            self.stdout.write("  Created merchant_b@test.com")
        else:
            self.stdout.write("  merchant_b@test.com already exists — skipping")

        if not KYCApplication.objects.filter(merchant=merchant_b).exists():
            app_b = KYCApplication.objects.create(merchant=merchant_b)

            # Attach personal detail
            KYCPersonalDetail.objects.create(
                application=app_b,
                name="Bob Merchant",
                email="merchant_b@test.com",
                phone="+91-9876543210",
            )

            # Attach business detail
            KYCBusinessDetail.objects.create(
                application=app_b,
                business_name="Bob's Trading Co.",
                business_type="retail",
                monthly_volume_usd="25000.00",
            )

            # Advance state: draft → submitted → under_review
            # All via transition() — no inline assignments. ✅
            transition(app_b, SUBMITTED)
            transition(app_b, UNDER_REVIEW)

            self.stdout.write(
                "  Created under_review application for merchant_b "
                f"(app_id={app_b.pk})"
            )
