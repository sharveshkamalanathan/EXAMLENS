import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Mail, 
  BookOpen, 
  FileText, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Search, 
  Trash2, 
  Reply, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart3,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { soundEffects } from '../utils/audioEffects';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'users' | 'system'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & State
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [messageStatusFilter, setMessageStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsData, usersData, messagesData] = await Promise.all([
        api.getAdminAnalytics().catch(() => null),
        api.getAdminUsers().catch(() => []),
        api.getAdminMessages().catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData || []);
      setMessages(messagesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllAdminData();
      soundEffects.playSuccessPing();
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      await api.updateAdminMessageStatus(messageId, newStatus);
      soundEffects.playSuccessPing();
      setActionNotice(`Message marked as ${newStatus}`);
      setTimeout(() => setActionNotice(null), 3000);
      // Update local state
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: newStatus } : m));
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage((prev: any) => ({ ...prev, status: newStatus }));
      }
      if (analytics) {
        const unreadCount = messages.filter(m => m.id !== messageId ? m.status === 'unread' : newStatus === 'unread').length;
        setAnalytics((prev: any) => ({ ...prev, total_unread_messages: unreadCount }));
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this inquiry message?")) return;
    try {
      await api.deleteAdminMessage(messageId);
      soundEffects.playSuccessPing();
      setActionNotice("Message deleted successfully");
      setTimeout(() => setActionNotice(null), 3000);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}" (${userEmail})?\nThis action cannot be undone and will remove all their examinations and submissions.`)) return;
    try {
      await api.deleteUser(userId);
      soundEffects.playSuccessPing();
      setActionNotice(`User ${userEmail} was permanently deleted.`);
      setTimeout(() => setActionNotice(null), 3000);
      setUsers(prev => prev.filter(u => u.id !== userId));
      loadAllAdminData();
    } catch (err: any) {
      alert(`Delete user failed: ${err.message || 'Error occurred'}`);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = !userSearchQuery || 
      u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.roll_number?.toLowerCase().includes(userSearchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Filtered Messages
  const filteredMessages = messages.filter(m => {
    return messageStatusFilter === 'all' || m.status === messageStatusFilter;
  });

  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Admin Identity & Notification Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Platform Master Console
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300 font-semibold">Live System Online</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight mt-1">
                Admin Command Center
              </h2>
              <p className="text-xs text-slate-300">
                Official Administrator: <span className="text-indigo-200 font-mono font-semibold">sharveshofficialmicro@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Sync Telemetry'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-700/40 transition-all"
            >
              Open Faculty View
            </button>
          </div>
        </div>

        {/* Action Notice toast */}
        {actionNotice && (
          <div className="mt-4 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.total_users ?? users.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {analytics?.total_teachers ?? 0} Teachers · {analytics?.total_students ?? 0} Students
          </p>
        </div>

        {/* Total Exams */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Examinations</span>
            <BookOpen className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.total_exams ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Configured rubrics active</p>
        </div>

        {/* Digitized Scripts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scanned Scripts</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.total_scripts ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {analytics?.total_pages_processed ?? 0} Physical pages OCR'd
          </p>
        </div>

        {/* Completed Evaluations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Evaluations</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.total_evaluations ?? 0}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Avg Score: {analytics?.avg_score ?? 0.0} pts
          </p>
        </div>

        {/* Inbound Messages */}
        <div 
          onClick={() => setActiveTab('messages')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-amber-400 cursor-pointer transition-colors relative"
        >
          {unreadMessagesCount > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          )}
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Inbox</span>
            <Mail className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>{messages.length}</span>
            {unreadMessagesCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                {unreadMessagesCount} unread
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Customer & visitor inquiries</p>
        </div>

        {/* Storage footprint */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Storage Used</span>
            <HardDrive className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.storage_used_mb ?? 0.0} MB
          </div>
          <p className="text-[10px] text-slate-400 mt-1">High-res scans & uploads</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'messages'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Inquiries & Messages</span>
          {unreadMessagesCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadMessagesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'system'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>OCR & Infrastructure</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Contact Inquiries */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Customer Inquiries</h3>
                <p className="text-xs text-slate-500">Messages sent via Contact Us form on landing page</p>
              </div>
              <button
                onClick={() => setActiveTab('messages')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>View All ({messages.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No contact inquiries received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.slice(0, 4).map(msg => (
                  <div 
                    key={msg.id}
                    onClick={() => { setSelectedMessage(msg); setActiveTab('messages'); }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{msg.name}</span>
                        <span className="text-[10px] text-slate-400">&lt;{msg.email}&gt;</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          msg.status === 'unread' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          msg.status === 'replied' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{msg.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform Health & Quick Admin Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Diagnostics</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Handwriting OCR Engine</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    RapidOCR ONNX (Active)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Local CPU/GPU inference · ~1.8s / page</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Word File Processing</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    python-docx Enabled
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Auto-renders DOCX/DOC to high-res answer script sheets</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Database Engine</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    SQLite / SQLAlchemy 2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Full ACID transactional storage</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Semantic AI Evaluation</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Cognitive Relevance Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Evaluates conceptual accuracy, avoids rigid verbatim checks</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INBOX / CONTACT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List (Left 1.2 col) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Customer Inquiries</h3>
              <div className="flex items-center space-x-1 text-xs">
                {['all', 'unread', 'read', 'replied'].map(st => (
                  <button
                    key={st}
                    onClick={() => setMessageStatusFilter(st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      messageStatusFilter === st 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No messages found matching status.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredMessages.map(msg => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (msg.status === 'unread') {
                          handleUpdateMessageStatus(msg.id, 'read');
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{msg.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          msg.status === 'unread' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          msg.status === 'replied' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{msg.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{msg.message}</p>
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                        <span>{msg.email}</span>
                        <span>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Detail (Right 1.8 col) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedMessage.subject}</h2>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                      <span>From: <strong className="text-slate-800 dark:text-slate-200">{selectedMessage.name}</strong></span>
                      <span>&bull;</span>
                      <a href={`mailto:${selectedMessage.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateMessageStatus(selectedMessage.id, selectedMessage.status === 'replied' ? 'read' : 'replied')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      {selectedMessage.status === 'replied' ? 'Mark as Read' : 'Mark as Replied'}
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-colors"
                      title="Delete inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>

                {/* Direct Action Reply Box */}
                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Reply to Sender</h4>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Open your mail client with prefilled recipient and subject line.
                    </p>
                  </div>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}&body=${encodeURIComponent(`Hi ${selectedMessage.name},\n\nThank you for reaching out to ExamLens.\n\nBest regards,\nSharveshwaran\nLead Administrator, ExamLens`)}`}
                    onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'replied')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all flex-shrink-0"
                  >
                    <Reply className="w-4 h-4" />
                    <span>Send Reply Email</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-3">
                <Mail className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Select an inquiry to view details</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click any message on the left panel to read the full inquiry, mark it as read or replied, or launch an email response.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USERS DIRECTORY & USAGE */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Users & Activity</h3>
              <p className="text-xs text-slate-500">Complete institutional roster, accounts, and examination usage</p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
                <option value="admin">Administrators</option>
              </select>

              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">User Profile</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Institution / Dept</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Usage Metric</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        u.role === 'teacher' ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{u.institution || 'NIT Calicut'}</div>
                      <div className="text-[10px] text-slate-400">{u.department || 'Computer Science'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {u.roll_number || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'teacher' || u.role === 'admin' ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {u.exams_count ?? 1} Exams Created
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {u.scripts_count ?? 1} Answer Scripts
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.full_name, u.email)}
                        title={`Delete account ${u.email}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors inline-flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM & OCR INFRASTRUCTURE */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <span>Neural OCR Pipeline Specifications</span>
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">RapidOCR ONNX Runtime Engine</span>
                Local, zero-cloud execution running on CPU with vector stroke recognition. No API keys or external server dependencies.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">Universal Question Pattern Segmentation</span>
                Multi-pass lookahead detection recognizing `Q.1)`, `q1)`, `1.`, `Ans 1`, `(1)`, `0.1)`, `QI)` with multi-line space lookahead tolerance.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">Word Document (.docx / .doc) Processing</span>
                Native parsing with python-docx, generating digitized lined script sheets for seamless evaluation.
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-cyan-500" />
              <span>Storage & Data Architecture</span>
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">Disk Storage</span>
                Physical scans organized under `/storage/uploads` and `/storage/processed` with non-destructive CLAHE enhancement caches.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">Security & Access Control</span>
                Role-based access tokens (JWT) with teacher review authority and audit logging for every mark modification.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">Platform Contact Inquiries</span>
                Visitor questions from the website Contact Us form are routed directly into this dashboard inbox with one-click email reply links.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
