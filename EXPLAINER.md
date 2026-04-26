# EXPLAINER.md — Playto KYC: Design Decisions & Code Audit

---

## 1. The State Machine

### Where does it live?

**File:** `backend/kyc/state_machine.py`  
**Key artifacts:** the `LEGAL_TRANSITIONS` dict and the `transition()` function.

### LEGAL_TRANSITIONS dict

```python
# kyc/state_machine.py — lines 38-46

LEGAL_TRANSITIONS: dict[str, list[str]] = {
    DRAFT: [SUBMITTED],
    SUBMITTED: [UNDER_REVIEW],
    UNDER_REVIEW: [APPROVED, REJECTED, MORE_INFO_REQUESTED],
    MORE_INFO_REQUESTED: [SUBMITTED],
    # Terminal states — no outgoing transitions
    APPROVED: [],
    REJECTED: [],
}
```

### transition() function

```python
# kyc/state_machine.py — lines 52-87

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
```

### How it prevents illegal transitions

`transition()` raises `django.core.exceptions.ValidationError` for two cases:
1. **No-op move** — the application is already in the requested state.
2. **Illegal move** — `new_status` is not in `LEGAL_TRANSITIONS[current]`.

Every view that calls `transition()` wraps it identically:

```python
# Example from KYCApplicationViewSet.submit (kyc/views.py)

try:
    transition(application, SUBMITTED)
except DjangoValidationError as exc:
    return _err(exc.message, http_status=400)
```

`_err()` returns `{"error": "...", "detail": "..."}` with **HTTP 400**.  
No view ever assigns `application.status` directly.

---

## 2. The Upload

### Where is validation done?

**File:** `backend/kyc/serializers.py`  
**Class:** `DocumentUploadSerializer`  
**Method:** `validate_file(self, file)`

### The validation code

```python
# kyc/serializers.py — lines 108-135

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

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
```

### What happens with a 50 MB file — exact trace

1. **Client** sends `POST /api/v1/applications/3/documents/` with a 50 MB file.
2. **`DocumentUploadView.post()`** (`kyc/views.py`) constructs a `DocumentUploadSerializer(data=request.data)` and calls `.is_valid()`.
3. DRF dispatches field-level validation to `validate_file(file)`.
4. `file.size` evaluates to `52_428_800` bytes — greater than `MAX_FILE_SIZE_BYTES` (`5_242_880`).
5. `serializers.ValidationError` is raised with payload:
   ```python
   {"error": "File too large.", "detail": "Maximum allowed size is 5 MB. Received 50.00 MB."}
   ```
6. The view catches the failed `.is_valid()` branch:
   ```python
   if not serializer.is_valid():
       return _err("File upload validation failed.", str(serializer.errors))
   ```
7. Response returned: **HTTP 400**  
   ```json
   {
     "error": "File upload validation failed.",
     "detail": "{'file': [{'error': 'File too large.', 'detail': 'Maximum allowed size is 5 MB. Received 50.00 MB.'}]}"
   }
   ```
8. The file is **never written to disk**. `serializer.save()` is never reached.

The magic-byte check is a deliberate second layer: even if someone renames a `.exe` to `.pdf`, `filetype.guess()` reads the actual header bytes and will return a non-PDF MIME, triggering a separate rejection.

---

## 3. The Queue

### Exact queryset from ReviewerQueueView

```python
# kyc/views.py — ReviewerQueueView.get(), lines 502-507

queue_statuses = [SUBMITTED, UNDER_REVIEW]
queue_qs = (
    KYCApplication.objects.filter(status__in=queue_statuses)
    .select_related("merchant", "business_detail")
    .order_by("submitted_at", "created_at")  # oldest first
)
```

### Why ordered by submitted_at (not created_at)?

Applications can sit in `draft` for days before being submitted. Ordering by `created_at` would surface applications that were created earliest but potentially submitted after others. Ordering by `submitted_at` correctly reflects **when the reviewer's clock started ticking** — the moment the merchant handed the application in.

`created_at` is used as a secondary sort key for the edge case where `submitted_at` is `NULL` (shouldn't happen in practice, but defensive).

### How at_risk is computed — SerializerMethodField

The serializer delegates directly to the model's `@property`:

```python
# kyc/serializers.py — ReviewerQueueItemSerializer, lines 192-193

def get_at_risk(self, obj) -> bool:
    return obj.at_risk  # computed property — no stored column ✅
```

The model property (`kyc/models.py`, lines 98-110):

```python
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
```

### Why at_risk is not stored in the database

Three reasons:

1. **It would immediately go stale.** If stored as a boolean column and computed at write-time, it would be correct for one instant and wrong for every subsequent second without a background job to continuously flip it.

2. **No migration, no background worker.** A computed property needs zero infrastructure — no cron job, no Celery task, no extra DB column to migrate.

3. **Always accurate.** Because `timezone.now()` is called at serialization time (i.e., at request time), the value returned to the reviewer is always the truth about *this exact moment* — not what was true when the record was last saved.

---

## 4. The Auth

### How merchant A is prevented from seeing merchant B's data

The enforcement happens in **`KYCApplicationViewSet.get_queryset()`**, which is called for every request — list, detail, and every custom action — before any data is returned.

```python
# kyc/views.py — KYCApplicationViewSet, lines 135-146

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
```

### What happens when merchant A hits merchant B's ID directly

Suppose merchant A's token and merchant B's `application_id=7`.

`GET /api/v1/applications/7/` invokes `get_object()`, which calls `get_queryset()` first.  
`get_queryset()` returns `KYCApplication.objects.filter(merchant=merchant_a)`.  
Application 7 belongs to merchant B, so it is **not in that queryset**.  
DRF's `get_object_or_404` then raises `Http404`.

The response is **HTTP 404** (not 403). This is intentional: returning 403 would confirm that application #7 exists. Returning 404 leaks nothing — from merchant A's perspective, application #7 simply does not exist.

---

## 5. The AI Audit

### Example: the login page was reviewer-only by default

In Phase 2, the AI scaffolded a login page with a **hardcoded reviewer check** that rejected anyone who wasn't a reviewer:

```python
# What the AI originally wrote (main.jsx — Phase 2 LoginPage.handleSubmit)

if (data.role !== 'reviewer') throw new Error('This dashboard is for reviewers only.');
localStorage.setItem('kyc_token', data.token);
localStorage.setItem('kyc_role', data.role);
window.location.href = '/reviewer/queue';
```

This meant that `merchant_a@test.com` would log in, get a valid token, but immediately receive the error _"This dashboard is for reviewers only."_ and be unable to proceed — even though Phase 3 needed merchants to log in and reach `/dashboard`.

### The replacement (Phase 3 main.jsx)

```javascript
// Replacement — main.jsx LoginPage.handleSubmit

localStorage.setItem('kyc_token', data.token);
localStorage.setItem('kyc_role',  data.role);
// Clear any stale app id from a previous session
localStorage.removeItem('kyc_app_id');

if (data.role === 'reviewer') navigate('/reviewer/queue', { replace: true });
else                          navigate('/dashboard',       { replace: true });
```

**Why this is correct:**  
- Removed the role assertion — both merchants and reviewers are valid users.
- Role-based redirection is now done with React Router's `navigate()` instead of `window.location.href`, which is consistent with the SPA navigation model and preserves browser history correctly.
- Clearing `kyc_app_id` on login prevents a stale cached application ID from a previous merchant session being picked up by a different merchant who logs in on the same device.
- Route guards (`MerchantRoute`, `ReviewerRoute`) enforce access control at the routing level, not the login page — which is the correct architectural layer for that concern.
