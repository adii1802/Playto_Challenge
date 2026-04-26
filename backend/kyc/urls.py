"""
kyc/urls.py
===========
All KYC routes, mounted under /api/v1/ (see playto_kyc/urls.py).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from kyc.views import (
    BusinessDetailView,
    DocumentUploadView,
    KYCApplicationViewSet,
    LoginView,
    NotificationListView,
    PersonalDetailView,
    ReviewerQueueView,
)

router = DefaultRouter()
router.register(r"applications", KYCApplicationViewSet, basename="application")

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="login"),

    # KYC Applications (CRUD + custom actions via router)
    path("", include(router.urls)),

    # Personal detail sub-resource
    path(
        "applications/<int:app_id>/personal-detail/",
        PersonalDetailView.as_view(),
        name="personal-detail",
    ),

    # Business detail sub-resource
    path(
        "applications/<int:app_id>/business-detail/",
        BusinessDetailView.as_view(),
        name="business-detail",
    ),

    # Document upload
    path(
        "applications/<int:app_id>/documents/",
        DocumentUploadView.as_view(),
        name="documents",
    ),

    # Merchant notifications
    path("notifications/", NotificationListView.as_view(), name="notifications"),

    # Reviewer queue + metrics
    path("reviewer/queue/", ReviewerQueueView.as_view(), name="reviewer-queue"),
]
