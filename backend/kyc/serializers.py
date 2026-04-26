"""
kyc/serializers.py
==================
All DRF ModelSerializers for the Playto KYC system.

Scoping contract:
- Every serializer that exposes KYCApplication data uses get_queryset()
  scoping in the corresponding ViewSet — not inline here.
- at_risk is a read-only SerializerMethodField (also backed by model property).

File validation:
- Magic-byte validation lives in DocumentUploadSerializer.validate_file()
  using the `filetype` library which reads actual file-header bytes (signatures).
  Extension-only checks are NOT used. ✅

Phase 2 additions:
- ReviewerQueueItemSerializer  — lightweight queue row with merchant name.
- ReviewerActionInputSerializer — validates { action, reason } POST body.
"""

import filetype
from django.conf import settings
from rest_framework import serializers

from kyc.models import (
    KYCApplication,
    KYCBusinessDetail,
    KYCDocument,
    KYCPersonalDetail,
    NotificationEvent,
    ReviewAction,
    User,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _error(message: str, detail: str = "") -> dict:
    """Consistent error shape used across the API."""
    return {"error": message, "detail": detail}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ---------------------------------------------------------------------------
# KYCPersonalDetail
# ---------------------------------------------------------------------------

class PersonalDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCPersonalDetail
        fields = ["id", "name", "email", "phone"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# KYCBusinessDetail
# ---------------------------------------------------------------------------

class BusinessDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCBusinessDetail
        fields = ["id", "business_name", "business_type", "monthly_volume_usd"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# KYCDocument
# ---------------------------------------------------------------------------

class DocumentSerializer(serializers.ModelSerializer):
    """Read serializer — used in application detail responses."""

    class Meta:
        model = KYCDocument
        fields = ["id", "doc_type", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Write serializer for document upload.
    Validates file via magic bytes (NOT extension). ✅
    """

    class Meta:
        model = KYCDocument
        fields = ["id", "doc_type", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]

    def validate_file(self, file):
        # --- Size check ---
        if file.size > MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError(
                _error(
                    "File too large.",
                    f"Maximum allowed size is 5 MB. Received {file.size / (1024*1024):.2f} MB.",
                )
            )

        # --- Magic-byte MIME check (NOT extension-based) ✅ ---
        # filetype reads the actual file-header signature bytes, not the filename.
        file.seek(0)
        header = file.read(2048)
        file.seek(0)

        kind = filetype.guess(header)
        mime = kind.mime if kind else "application/octet-stream"

        if mime not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                _error(
                    "Invalid file type.",
                    f"Detected MIME type '{mime}'. Allowed types: PDF, JPG, PNG.",
                )
            )

        return file


# ---------------------------------------------------------------------------
# KYCApplication
# ---------------------------------------------------------------------------

class KYCApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    at_risk = serializers.SerializerMethodField()

    class Meta:
        model = KYCApplication
        fields = [
            "id",
            "merchant",
            "status",
            "created_at",
            "submitted_at",
            "last_status_change_at",
            "at_risk",
        ]
        read_only_fields = fields

    def get_at_risk(self, obj) -> bool:
        return obj.at_risk


# ---------------------------------------------------------------------------
# Phase 2 — Reviewer dashboard serializers
# ---------------------------------------------------------------------------

class ReviewerQueueItemSerializer(serializers.ModelSerializer):
    """
    Queue-row serializer used by GET /api/v1/reviewer/queue/.
    Includes merchant name and email so the UI can show them directly.
    at_risk is a SerializerMethodField — never a stored column. ✅
    """

    at_risk = serializers.SerializerMethodField()
    merchant_name = serializers.SerializerMethodField()
    merchant_email = serializers.SerializerMethodField()

    class Meta:
        model = KYCApplication
        fields = [
            "id",
            "merchant",
            "merchant_name",
            "merchant_email",
            "status",
            "submitted_at",
            "at_risk",
        ]
        read_only_fields = fields

    def get_at_risk(self, obj) -> bool:
        return obj.at_risk  # computed property — no stored column ✅

    def get_merchant_name(self, obj) -> str:
        # Prefer business name, fall back to email prefix
        if hasattr(obj, "business_detail") and obj.business_detail:
            return obj.business_detail.business_name
        return obj.merchant.email.split("@")[0]

    def get_merchant_email(self, obj) -> str:
        return obj.merchant.email


class ReviewerActionInputSerializer(serializers.Serializer):
    """
    Validates the body of POST /api/v1/reviewer/application/:id/action/.
    Does NOT write to the DB — the view calls the state machine directly.
    """

    VALID_ACTIONS = ["approved", "rejected", "more_info_requested"]

    action = serializers.ChoiceField(choices=VALID_ACTIONS)
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=2000,
    )

    def validate(self, data):
        # reason is mandatory for rejection and more_info_requested
        if data["action"] in ("rejected", "more_info_requested") and not data.get("reason"):
            raise serializers.ValidationError(
                {"reason": "A reason is required for this action."}
            )
        return data


class KYCApplicationDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views — includes nested relations."""

    at_risk = serializers.SerializerMethodField()
    personal_detail = PersonalDetailSerializer(read_only=True)
    business_detail = BusinessDetailSerializer(read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    review_actions = serializers.SerializerMethodField()

    class Meta:
        model = KYCApplication
        fields = [
            "id",
            "merchant",
            "status",
            "created_at",
            "submitted_at",
            "last_status_change_at",
            "at_risk",
            "personal_detail",
            "business_detail",
            "documents",
            "review_actions",
        ]
        read_only_fields = fields

    def get_at_risk(self, obj) -> bool:
        return obj.at_risk

    def get_review_actions(self, obj):
        qs = obj.review_actions.select_related("reviewer").all()
        return ReviewActionSerializer(qs, many=True).data


# ---------------------------------------------------------------------------
# ReviewAction
# ---------------------------------------------------------------------------

class ReviewActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewAction
        fields = ["id", "application", "reviewer", "action", "reason", "created_at"]
        read_only_fields = ["id", "reviewer", "created_at"]


# ---------------------------------------------------------------------------
# NotificationEvent
# ---------------------------------------------------------------------------

class NotificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEvent
        fields = ["id", "merchant", "event_type", "timestamp", "payload"]
        read_only_fields = fields
