"""
kyc/state_machine.py
====================
SINGLE SOURCE OF TRUTH for KYC application state transitions.

Rules:
- LEGAL_TRANSITIONS is the only place that encodes allowed moves.
- transition() is the only function that may change application.status.
- No view, serializer, or management command may assign application.status
  directly — they must call transition() instead.
"""

from django.core.exceptions import ValidationError


# ---------------------------------------------------------------------------
# State constants
# ---------------------------------------------------------------------------
DRAFT = "draft"
SUBMITTED = "submitted"
UNDER_REVIEW = "under_review"
APPROVED = "approved"
REJECTED = "rejected"
MORE_INFO_REQUESTED = "more_info_requested"

ALL_STATUSES = [
    DRAFT,
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    MORE_INFO_REQUESTED,
]

# ---------------------------------------------------------------------------
# Legal transitions — (from_state, to_state)
# ---------------------------------------------------------------------------
LEGAL_TRANSITIONS: dict[str, list[str]] = {
    DRAFT: [SUBMITTED],
    SUBMITTED: [UNDER_REVIEW],
    UNDER_REVIEW: [APPROVED, REJECTED, MORE_INFO_REQUESTED],
    MORE_INFO_REQUESTED: [SUBMITTED],
    # Terminal states — no outgoing transitions
    APPROVED: [],
    REJECTED: [],
}


# ---------------------------------------------------------------------------
# Transition function — the ONLY place status is changed
# ---------------------------------------------------------------------------
def transition(application, new_status: str) -> None:
    """
    Attempt to move *application* to *new_status*.

    Saves the application (status + last_status_change_at) on success.
    Raises django.core.exceptions.ValidationError on illegal or no-op moves.

    NOTE: Callers are responsible for creating the NotificationEvent AFTER
    this function returns successfully.
    """
    from django.utils import timezone  # local import to avoid circular deps

    current = application.status

    if current == new_status:
        raise ValidationError(
            f"Application is already in state {new_status}."
        )

    if new_status not in LEGAL_TRANSITIONS.get(current, []):
        raise ValidationError(
            f"Illegal transition: {current} → {new_status}. "
            f"Allowed transitions from '{current}': "
            f"{LEGAL_TRANSITIONS.get(current, [])}."
        )

    application.status = new_status
    application.last_status_change_at = timezone.now()

    # Track submission timestamp once
    if new_status == SUBMITTED and application.submitted_at is None:
        application.submitted_at = timezone.now()

    application.save(
        update_fields=["status", "last_status_change_at", "submitted_at"]
    )
