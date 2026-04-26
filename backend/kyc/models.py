"""
kyc/models.py
=============
All database models for the Playto KYC system.

Key design decisions:
- Custom User model with email as USERNAME_FIELD and a role field.
- at_risk is a COMPUTED PROPERTY — no migration, no stored boolean.
- submitted_at is set once (inside state_machine.transition) and never
  overwritten.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from kyc.state_machine import ALL_STATUSES, DRAFT, SUBMITTED, UNDER_REVIEW


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role="merchant", **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", "reviewer")
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("merchant", "Merchant"),
        ("reviewer", "Reviewer"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="merchant")

    # Required by AbstractBaseUser / Django admin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return f"{self.email} ({self.role})"


# ---------------------------------------------------------------------------
# KYCApplication
# ---------------------------------------------------------------------------

STATUS_CHOICES = [(s, s) for s in ALL_STATUSES]


class KYCApplication(models.Model):
    merchant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="applications",
        limit_choices_to={"role": "merchant"},
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # submitted_at is set by state_machine.transition() — never assign directly
    submitted_at = models.DateTimeField(null=True, blank=True)
    last_status_change_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"KYCApplication #{self.pk} — {self.merchant.email} [{self.status}]"

    # ------------------------------------------------------------------
    # SLA flag — computed, never stored, never migrated
    # ------------------------------------------------------------------
    @property
    def at_risk(self) -> bool:
        """
        True when the application has been in an active review state for
        more than 24 hours since submission.
        """
        from datetime import timedelta

        if self.status not in (SUBMITTED, UNDER_REVIEW):
            return False
        if self.submitted_at is None:
            return False
        return (timezone.now() - self.submitted_at) > timedelta(hours=24)


# ---------------------------------------------------------------------------
# KYCPersonalDetail  (one-to-one with KYCApplication)
# ---------------------------------------------------------------------------

class KYCPersonalDetail(models.Model):
    application = models.OneToOneField(
        KYCApplication,
        on_delete=models.CASCADE,
        related_name="personal_detail",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

    def __str__(self):
        return f"PersonalDetail for App #{self.application_id}"


# ---------------------------------------------------------------------------
# KYCBusinessDetail  (one-to-one with KYCApplication)
# ---------------------------------------------------------------------------

class KYCBusinessDetail(models.Model):
    application = models.OneToOneField(
        KYCApplication,
        on_delete=models.CASCADE,
        related_name="business_detail",
    )
    business_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=100)
    monthly_volume_usd = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f"BusinessDetail for App #{self.application_id}"


# ---------------------------------------------------------------------------
# KYCDocument
# ---------------------------------------------------------------------------

def document_upload_path(instance, filename):
    """Store files under media/documents/<application_id>/<filename>."""
    return f"documents/{instance.application_id}/{filename}"


class KYCDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ("pan", "PAN"),
        ("aadhaar", "Aadhaar"),
        ("bank_statement", "Bank Statement"),
    ]

    application = models.ForeignKey(
        KYCApplication,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    doc_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to=document_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document [{self.doc_type}] for App #{self.application_id}"


# ---------------------------------------------------------------------------
# NotificationEvent
# ---------------------------------------------------------------------------

class NotificationEvent(models.Model):
    merchant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
        limit_choices_to={"role": "merchant"},
    )
    event_type = models.CharField(max_length=100)
    timestamp = models.DateTimeField(default=timezone.now)
    payload = models.JSONField(default=dict)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"NotificationEvent [{self.event_type}] for {self.merchant.email}"


# ---------------------------------------------------------------------------
# ReviewAction
# ---------------------------------------------------------------------------

class ReviewAction(models.Model):
    application = models.ForeignKey(
        KYCApplication,
        on_delete=models.CASCADE,
        related_name="review_actions",
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="review_actions",
        limit_choices_to={"role": "reviewer"},
    )
    action = models.CharField(max_length=50)
    reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"ReviewAction [{self.action}] on App #{self.application_id} by {self.reviewer.email}"
