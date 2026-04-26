"""
kyc/views.py
============
All API views for the Playto KYC system.

Access control contract:
- Merchant: can only see/touch their own applications (enforced in get_queryset). ✅
- Reviewer: can read all applications; can perform review actions.

State transitions:
- ALL status changes go through state_machine.transition(). ✅
- No inline status assignments anywhere in this file. ✅

Error shape: { "error": "...", "detail": "..." } via _err() helper.
"""

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from kyc.models import (
    KYCApplication,
    KYCDocument,
    KYCPersonalDetail,
    KYCBusinessDetail,
    NotificationEvent,
    ReviewAction,
    User,
)
from kyc.serializers import (
    BusinessDetailSerializer,
    DocumentUploadSerializer,
    DocumentSerializer,
    KYCApplicationDetailSerializer,
    KYCApplicationListSerializer,
    LoginSerializer,
    NotificationEventSerializer,
    PersonalDetailSerializer,
    ReviewActionSerializer,
    ReviewerQueueItemSerializer,
    ReviewerActionInputSerializer,
)
from kyc.state_machine import (
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    MORE_INFO_REQUESTED,
    transition,
)
from django.core.exceptions import ValidationError as DjangoValidationError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _err(message: str, detail: str = "", http_status: int = 400) -> Response:
    """Return a consistent error response."""
    return Response(
        {"error": message, "detail": detail},
        status=http_status,
    )


def _notify_status_change(application, old_status: str, new_status: str):
    """Write a NotificationEvent row after every status change."""
    NotificationEvent.objects.create(
        merchant=application.merchant,
        event_type="kyc_status_changed",
        timestamp=timezone.now(),
        payload={
            "old_status": old_status,
            "new_status": new_status,
            "application_id": application.pk,
        },
    )


def _is_merchant(user: User) -> bool:
    return user.role == "merchant"


def _is_reviewer(user: User) -> bool:
    return user.role == "reviewer"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginView(APIView):
    """POST /api/v1/auth/login/  → { token, role }"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return _err("Invalid payload.", str(serializer.errors))

        from django.contrib.auth import authenticate

        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return _err("Invalid credentials.", http_status=401)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "role": user.role})


# ---------------------------------------------------------------------------
# KYCApplication
# ---------------------------------------------------------------------------

class KYCApplicationViewSet(viewsets.ModelViewSet):
    """
    CRUD for KYC applications.

    Merchant: scoped to their own applications in get_queryset. ✅
    Reviewer: read-only access to all applications.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = KYCApplication.objects.select_related(
            "merchant", "personal_detail", "business_detail"
        ).prefetch_related("documents", "review_actions__reviewer")

        if _is_merchant(user):
            # Scope to the requesting merchant's applications ✅
            return qs.filter(merchant=user)
        if _is_reviewer(user):
            return qs.all()
        return KYCApplication.objects.none()

    def get_serializer_class(self):
        if self.action == "list":
            return KYCApplicationListSerializer
        return KYCApplicationDetailSerializer

    def create(self, request, *args, **kwargs):
        if not _is_merchant(request.user):
            return _err("Only merchants can create applications.", http_status=403)
        application = KYCApplication.objects.create(merchant=request.user)
        return Response(
            KYCApplicationDetailSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        return _err("Use the dedicated action endpoints to update applications.", http_status=405)

    def partial_update(self, request, *args, **kwargs):
        return _err("Use the dedicated action endpoints to update applications.", http_status=405)

    # ------------------------------------------------------------------
    # Merchant-facing: submit application
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        """POST /api/v1/applications/:id/submit/"""
        application = self.get_object()

        if not _is_merchant(request.user):
            return _err("Only merchants can submit applications.", http_status=403)

        # ── Completeness checks before transitioning ──────────────────────
        if not hasattr(application, "personal_detail"):
            return _err(
                "Incomplete application.",
                "Personal details are required before submitting.",
            )
        if not hasattr(application, "business_detail"):
            return _err(
                "Incomplete application.",
                "Business details are required before submitting.",
            )
        if not application.documents.exists():
            return _err(
                "Incomplete application.",
                "At least one document must be uploaded before submitting.",
            )

        old_status = application.status
        try:
            transition(application, SUBMITTED)
        except DjangoValidationError as exc:
            return _err(exc.message, http_status=400)

        _notify_status_change(application, old_status, SUBMITTED)
        return Response(KYCApplicationDetailSerializer(application).data)

    # ------------------------------------------------------------------
    # Reviewer-facing: start review
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="start-review")
    def start_review(self, request, pk=None):
        """POST /api/v1/applications/:id/start-review/"""
        application = self.get_object()

        if not _is_reviewer(request.user):
            return _err("Only reviewers can start a review.", http_status=403)

        old_status = application.status
        try:
            transition(application, UNDER_REVIEW)
        except DjangoValidationError as exc:
            return _err(exc.message, http_status=400)

        _notify_status_change(application, old_status, UNDER_REVIEW)
        return Response(KYCApplicationDetailSerializer(application).data)

    # ------------------------------------------------------------------
    # Reviewer-facing: approve
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """POST /api/v1/applications/:id/approve/"""
        application = self.get_object()

        if not _is_reviewer(request.user):
            return _err("Only reviewers can approve applications.", http_status=403)

        old_status = application.status
        try:
            transition(application, APPROVED)
        except DjangoValidationError as exc:
            return _err(exc.message, http_status=400)

        reason = request.data.get("reason", "")
        ReviewAction.objects.create(
            application=application,
            reviewer=request.user,
            action=APPROVED,
            reason=reason,
        )
        _notify_status_change(application, old_status, APPROVED)
        return Response(KYCApplicationDetailSerializer(application).data)

    # ------------------------------------------------------------------
    # Reviewer-facing: reject
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        """POST /api/v1/applications/:id/reject/"""
        application = self.get_object()

        if not _is_reviewer(request.user):
            return _err("Only reviewers can reject applications.", http_status=403)

        reason = request.data.get("reason", "")
        if not reason:
            return _err("A reason is required when rejecting an application.")

        old_status = application.status
        try:
            transition(application, REJECTED)
        except DjangoValidationError as exc:
            return _err(exc.message, http_status=400)

        ReviewAction.objects.create(
            application=application,
            reviewer=request.user,
            action=REJECTED,
            reason=reason,
        )
        _notify_status_change(application, old_status, REJECTED)
        return Response(KYCApplicationDetailSerializer(application).data)

    # ------------------------------------------------------------------
    # Reviewer-facing: request more info
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="request-more-info")
    def request_more_info(self, request, pk=None):
        """POST /api/v1/applications/:id/request-more-info/"""
        application = self.get_object()

        if not _is_reviewer(request.user):
            return _err("Only reviewers can request more information.", http_status=403)

        reason = request.data.get("reason", "")
        if not reason:
            return _err("A reason is required when requesting more information.")

        old_status = application.status
        try:
            transition(application, MORE_INFO_REQUESTED)
        except DjangoValidationError as exc:
            return _err(exc.message, http_status=400)

        ReviewAction.objects.create(
            application=application,
            reviewer=request.user,
            action=MORE_INFO_REQUESTED,
            reason=reason,
        )
        _notify_status_change(application, old_status, MORE_INFO_REQUESTED)
        return Response(KYCApplicationDetailSerializer(application).data)


# ---------------------------------------------------------------------------
# Personal Detail
# ---------------------------------------------------------------------------

class PersonalDetailView(APIView):
    """
    GET/POST/PUT  /api/v1/applications/:app_id/personal-detail/

    Merchant: must own the application. ✅
    Reviewer: read-only.
    """

    permission_classes = [IsAuthenticated]

    def _get_application(self, request, app_id):
        if _is_merchant(request.user):
            return get_object_or_404(
                KYCApplication, pk=app_id, merchant=request.user
            )
        return get_object_or_404(KYCApplication, pk=app_id)

    def get(self, request, app_id):
        app = self._get_application(request, app_id)
        if not hasattr(app, "personal_detail"):
            return _err("Personal detail not found.", http_status=404)
        return Response(PersonalDetailSerializer(app.personal_detail).data)

    def post(self, request, app_id):
        if not _is_merchant(request.user):
            return _err("Only merchants can add personal details.", http_status=403)
        app = self._get_application(request, app_id)
        if hasattr(app, "personal_detail"):
            return _err(
                "Personal detail already exists. Use PUT to update.",
                http_status=400,
            )
        serializer = PersonalDetailSerializer(data=request.data)
        if not serializer.is_valid():
            return _err("Validation failed.", str(serializer.errors))
        serializer.save(application=app)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, app_id):
        if not _is_merchant(request.user):
            return _err("Only merchants can update personal details.", http_status=403)
        app = self._get_application(request, app_id)
        if not hasattr(app, "personal_detail"):
            return _err("Personal detail not found. Use POST to create.", http_status=404)
        serializer = PersonalDetailSerializer(
            app.personal_detail, data=request.data
        )
        if not serializer.is_valid():
            return _err("Validation failed.", str(serializer.errors))
        serializer.save()
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Business Detail
# ---------------------------------------------------------------------------

class BusinessDetailView(APIView):
    """
    GET/POST/PUT  /api/v1/applications/:app_id/business-detail/

    Merchant: must own the application. ✅
    Reviewer: read-only.
    """

    permission_classes = [IsAuthenticated]

    def _get_application(self, request, app_id):
        if _is_merchant(request.user):
            return get_object_or_404(
                KYCApplication, pk=app_id, merchant=request.user
            )
        return get_object_or_404(KYCApplication, pk=app_id)

    def get(self, request, app_id):
        app = self._get_application(request, app_id)
        if not hasattr(app, "business_detail"):
            return _err("Business detail not found.", http_status=404)
        return Response(BusinessDetailSerializer(app.business_detail).data)

    def post(self, request, app_id):
        if not _is_merchant(request.user):
            return _err("Only merchants can add business details.", http_status=403)
        app = self._get_application(request, app_id)
        if hasattr(app, "business_detail"):
            return _err(
                "Business detail already exists. Use PUT to update.",
                http_status=400,
            )
        serializer = BusinessDetailSerializer(data=request.data)
        if not serializer.is_valid():
            return _err("Validation failed.", str(serializer.errors))
        serializer.save(application=app)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, app_id):
        if not _is_merchant(request.user):
            return _err("Only merchants can update business details.", http_status=403)
        app = self._get_application(request, app_id)
        if not hasattr(app, "business_detail"):
            return _err("Business detail not found. Use POST to create.", http_status=404)
        serializer = BusinessDetailSerializer(
            app.business_detail, data=request.data
        )
        if not serializer.is_valid():
            return _err("Validation failed.", str(serializer.errors))
        serializer.save()
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Document Upload
# ---------------------------------------------------------------------------

class DocumentUploadView(APIView):
    """
    GET  /api/v1/applications/:app_id/documents/       → list documents
    POST /api/v1/applications/:app_id/documents/       → upload document
         Validates via magic bytes. ✅
         Rejects if >5 MB. ✅
    """

    permission_classes = [IsAuthenticated]

    def _get_application(self, request, app_id):
        if _is_merchant(request.user):
            return get_object_or_404(
                KYCApplication, pk=app_id, merchant=request.user
            )
        return get_object_or_404(KYCApplication, pk=app_id)

    def get(self, request, app_id):
        app = self._get_application(request, app_id)
        documents = app.documents.all()
        return Response(DocumentSerializer(documents, many=True).data)

    def post(self, request, app_id):
        if not _is_merchant(request.user):
            return _err("Only merchants can upload documents.", http_status=403)
        app = self._get_application(request, app_id)
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return _err("File upload validation failed.", str(serializer.errors))
        serializer.save(application=app)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class NotificationListView(APIView):
    """GET /api/v1/notifications/ — returns the requesting merchant's events."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_merchant(request.user):
            return _err("Only merchants can view their notifications.", http_status=403)
        qs = NotificationEvent.objects.filter(merchant=request.user)
        return Response(NotificationEventSerializer(qs, many=True).data)


# ---------------------------------------------------------------------------
# Phase 2 — Reviewer dashboard endpoints
# ---------------------------------------------------------------------------

class ReviewerQueueView(APIView):
    """
    GET /api/v1/reviewer/queue/
    Returns submitted + under_review applications, oldest first.
    Each row includes merchant_name, merchant_email, status, submitted_at, at_risk.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_reviewer(request.user):
            return _err("Only reviewers can access the queue.", http_status=403)

        queue_statuses = [SUBMITTED, UNDER_REVIEW]
        queue_qs = (
            KYCApplication.objects.filter(status__in=queue_statuses)
            .select_related("merchant", "business_detail")
            .order_by("submitted_at", "created_at")  # oldest first
        )
        return Response(
            ReviewerQueueItemSerializer(queue_qs, many=True).data
        )


class ReviewerMetricsView(APIView):
    """
    GET /api/v1/reviewer/metrics/
    Returns: queue_count, avg_time_in_queue_hours, approval_rate_last_7_days.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_reviewer(request.user):
            return _err("Only reviewers can access metrics.", http_status=403)

        from datetime import timedelta

        queue_statuses = [SUBMITTED, UNDER_REVIEW]
        active_apps = list(
            KYCApplication.objects.filter(status__in=queue_statuses)
        )

        # Average hours in queue (Python-side, avoids DB-specific duration math)
        now = timezone.now()
        durations = [
            (now - app.submitted_at).total_seconds() / 3600
            for app in active_apps
            if app.submitted_at
        ]
        avg_hours = round(sum(durations) / len(durations), 2) if durations else None

        # 7-day approval rate
        seven_days_ago = now - timedelta(days=7)
        recent_closed = KYCApplication.objects.filter(
            last_status_change_at__gte=seven_days_ago,
            status__in=[APPROVED, REJECTED],
        )
        total_closed = recent_closed.count()
        approved_count = recent_closed.filter(status=APPROVED).count()
        approval_rate = (
            round(approved_count / total_closed * 100, 1) if total_closed else None
        )

        return Response(
            {
                "queue_count": len(active_apps),
                "avg_time_in_queue_hours": avg_hours,
                "approval_rate_last_7_days": approval_rate,
            }
        )


class ReviewerApplicationDetailView(APIView):
    """
    GET /api/v1/reviewer/application/:id/
    Full detail: personal, business, documents, review history.
    Reviewer-only. ✅
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not _is_reviewer(request.user):
            return _err("Only reviewers can access application details.", http_status=403)

        application = get_object_or_404(
            KYCApplication.objects.select_related(
                "merchant", "personal_detail", "business_detail"
            ).prefetch_related("documents", "review_actions__reviewer"),
            pk=pk,
        )
        return Response(KYCApplicationDetailSerializer(application).data)


class ReviewerApplicationActionView(APIView):
    """
    POST /api/v1/reviewer/application/:id/action/
    Body: { action: "approved" | "rejected" | "more_info_requested", reason: "..." }

    Rules:
    - Reviewer-only. ✅
    - Input validated by ReviewerActionInputSerializer. ✅
    - Status change goes through state_machine.transition() ONLY. ✅
    - Never assigns application.status directly. ✅
    """

    permission_classes = [IsAuthenticated]

    # Map action string → state machine constant
    _ACTION_TO_STATE = {
        "approved": APPROVED,
        "rejected": REJECTED,
        "more_info_requested": MORE_INFO_REQUESTED,
    }

    def post(self, request, pk):
        if not _is_reviewer(request.user):
            return _err("Only reviewers can perform review actions.", http_status=403)

        application = get_object_or_404(
            KYCApplication.objects.select_related("merchant"),
            pk=pk,
        )

        # Validate input
        serializer = ReviewerActionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return _err("Invalid action payload.", str(serializer.errors))

        action_str = serializer.validated_data["action"]
        reason = serializer.validated_data.get("reason", "")
        new_status = self._ACTION_TO_STATE[action_str]

        # If the application is still in SUBMITTED, auto-move it to UNDER_REVIEW first
        # so the reviewer can approve/reject/request-info without a separate step.
        if application.status == SUBMITTED and new_status in (APPROVED, REJECTED, MORE_INFO_REQUESTED):
            old_status = application.status
            try:
                transition(application, UNDER_REVIEW)
            except DjangoValidationError as exc:
                return _err(exc.message, http_status=400)
            _notify_status_change(application, old_status, UNDER_REVIEW)

        # Now perform the requested transition via the state machine
        old_status = application.status
        try:
            transition(application, new_status)
        except DjangoValidationError as exc:
            return _err(exc.message, http_status=400)

        # Record the review action
        ReviewAction.objects.create(
            application=application,
            reviewer=request.user,
            action=action_str,
            reason=reason,
        )
        _notify_status_change(application, old_status, new_status)

        return Response(KYCApplicationDetailSerializer(application).data)
