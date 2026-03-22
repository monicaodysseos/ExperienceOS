from django.urls import path
from . import views
from payments.invoice_views import OrgInvoicesView, InvoiceDownloadView

urlpatterns = [
    # Organisation
    path('', views.OrgDetailView.as_view(), name='org-detail'),
    path('create/', views.OrgCreateView.as_view(), name='org-create'),
    path('dashboard/', views.OrgDashboardView.as_view(), name='org-dashboard'),
    path('dashboard/dept-head/', views.DeptHeadDashboardView.as_view(), name='org-dashboard-dept-head'),
    path('bookings/', views.OrgBookingsView.as_view(), name='org-bookings'),
    path('invoices/', OrgInvoicesView.as_view(), name='org-invoices'),
    path('invoices/<str:invoice_number>/download/', InvoiceDownloadView.as_view(), name='invoice-download'),
    path('analytics/', views.OrgAnalyticsView.as_view(), name='org-analytics'),
    path('team/', views.TeamMembersView.as_view(), name='org-team'),
    path('team/invite/', views.TeamInviteView.as_view(), name='org-invite'),
    path('invite/accept/', views.AcceptInviteView.as_view(), name='org-invite-accept'),
    path('invite/lookup/', views.LookupInviteView.as_view(), name='org-invite-lookup'),

    # Departments
    path('departments/', views.DepartmentListCreateView.as_view(), name='org-departments'),
    path('departments/<int:dept_id>/', views.DepartmentDetailView.as_view(), name='org-department-detail'),
    path('departments/<int:dept_id>/budget/', views.DepartmentBudgetView.as_view(), name='org-department-budget'),
    path('departments/<int:dept_id>/transactions/', views.DepartmentTransactionsView.as_view(), name='org-department-transactions'),
    path('departments/<int:dept_id>/book/', views.DeptBookingView.as_view(), name='org-department-book'),

    # Teams
    path('departments/<int:dept_id>/teams/', views.TeamListCreateView.as_view(), name='org-department-teams'),
    path('departments/<int:dept_id>/teams/<int:team_id>/', views.TeamDetailView.as_view(), name='org-team-detail'),
    path('departments/<int:dept_id>/teams/<int:team_id>/members/', views.TeamMemberAddView.as_view(), name='org-team-member-add'),
    path('departments/<int:dept_id>/teams/<int:team_id>/members/<int:user_id>/', views.TeamMemberRemoveView.as_view(), name='org-team-member-remove'),

    # My teams (employee)
    path('my-teams/', views.MyTeamsView.as_view(), name='org-my-teams'),

    # Polls
    path('teams/<int:team_id>/polls/', views.PollListCreateView.as_view(), name='org-team-polls'),
    path('polls/<int:poll_id>/', views.PollDetailView.as_view(), name='org-poll-detail'),
    path('polls/<int:poll_id>/vote/', views.PollVoteView.as_view(), name='org-poll-vote'),
    path('polls/<int:poll_id>/close/', views.PollCloseView.as_view(), name='org-poll-close'),

    # Suggestions
    path('teams/<int:team_id>/suggestions/', views.SuggestionListCreateView.as_view(), name='org-team-suggestions'),
    path('suggestions/<int:suggestion_id>/upvote/', views.SuggestionUpvoteView.as_view(), name='org-suggestion-upvote'),
]
