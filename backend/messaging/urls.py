from django.urls import path

from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', views.ConversationCreateView.as_view(), name='conversation-create'),
    path('conversations/<int:pk>/', views.ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<int:pk>/send/', views.SendMessageView.as_view(), name='send-message'),
    path('conversations/<int:pk>/read/', views.MarkReadView.as_view(), name='mark-read'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
]
