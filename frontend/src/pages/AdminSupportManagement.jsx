import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/ui';
import Layout from '../components/Layout';
import axiosInstance from '../utils/axios';

export default function AdminSupportManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, assigned_to_me
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [updating, setUpdating] = useState(false);

  const getReturnPath = () => {
    return '/admin/dashboard';
  };

  const getReturnButtonText = () => {
    return 'Back to Admin Dashboard';
  };

  const fetchTickets = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (assignmentFilter === 'assigned_to_me') params.assigned_to_me = true;

      const { data } = await axiosInstance.get('/admin/support/tickets', { params });
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  // Filter tickets based on assignment
  const filteredTickets = assignmentFilter === 'assigned_to_me'
    ? tickets.filter(ticket => ticket.assigned_admin_email === user?.email)
    : tickets;

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      if (adminResponse.trim()) {
        formData.append('admin_response', adminResponse.trim());
      }

      await axiosInstance.put(`/admin/support/tickets/${selectedTicket.id}`, formData);

      // Refresh tickets
      await fetchTickets();
      setShowModal(false);
      setSelectedTicket(null);
      setAdminResponse('');
      setNewStatus('open');
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setAdminResponse(ticket.admin_response || '');
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'technical':
        return '🔧';
      case 'feature':
        return '✨';
      case 'bug':
        return '🐛';
      case 'account':
        return '👤';
      case 'billing':
        return '💳';
      default:
        return '📝';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.229l1.562-1.562C15.759 8.071 16 9.007 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.532a1 1 0 00-1.414-1.414l-.705.705a2 2 0 01-2.83-2.83l.704-.705a1 1 0 00-1.414-1.414l-.705.705a4 4 0 005.66 5.66l.705-.705zm6.435-1.484a1 1 0 00-1.414-1.414l-.705.705a2 2 0 01-2.83-2.83l.704-.705a1 1 0 00-1.414-1.414l-.705.705a4 4 0 005.66 5.66l.705-.705zM8 10a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                </svg>
                Support Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and resolve support tickets
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(getReturnPath())}
                variant="secondary"
              >
                {getReturnButtonText()}
              </Button>
              <Button
                onClick={fetchTickets}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignment:</span>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Tickets</option>
                <option value="assigned_to_me">Assigned to Me</option>
              </select>
            </div>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTickets.length} ticket(s) found
            </span>
          </div>
        </Card>

        {/* Tickets List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.229l1.562-1.562C15.759 8.071 16 9.007 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.532a1 1 0 00-1.414-1.414l-.705.705a2 2 0 01-2.83-2.83l.704-.705a1 1 0 00-1.414-1.414l-.705.705a4 4 0 005.66 5.66l.705-.705zm6.435-1.484a1 1 0 00-1.414-1.414l-.705.705a2 2 0 01-2.83-2.83l.704-.705a1 1 0 00-1.414-1.414l-.705.705a4 4 0 005.66 5.66l.705-.705zM8 10a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {assignmentFilter === 'assigned_to_me' 
                ? 'No tickets assigned to you.' 
                : statusFilter === 'all' 
                  ? 'No support tickets have been submitted yet.' 
                  : `No ${statusFilter} tickets found.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(ticket.category)}</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {ticket.subject}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <p><strong>From:</strong> {ticket.user_name} ({ticket.user_email})</p>
                      <p><strong>Category:</strong> {ticket.category}</p>
                      {ticket.assigned_admin_email && (
                        <p><strong>Assigned to:</strong> {ticket.assigned_admin_email}</p>
                      )}
                      <p><strong>Submitted:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
                      {ticket.resolved_at && (
                        <p><strong>Resolved:</strong> {new Date(ticket.resolved_at).toLocaleString()}</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>
                    
                    {ticket.admin_response && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Admin Response:</h4>
                        <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                          {ticket.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      onClick={() => openTicketModal(ticket)}
                      variant="primary"
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Manage
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Update Ticket Modal */}
        {showModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Update Support Ticket
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Response
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={6}
                    placeholder="Add your response to the user..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTicket(null);
                    setAdminResponse('');
                    setNewStatus('open');
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTicket}
                  disabled={updating}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Ticket'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

