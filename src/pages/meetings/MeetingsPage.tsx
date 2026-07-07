import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Check, X, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Meeting } from '../../types';
import { listMeetings, createMeeting, meetingAction, deleteMeeting } from '../../api/meetings';
import { listUsers, SimpleUser } from '../../api/users';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  accepted: 'success',
  pending: 'warning',
  rejected: 'error',
  cancelled: 'error',
  completed: 'secondary',
};

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [people, setPeople] = useState<SimpleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const oppositeRole = user?.role === 'entrepreneur' ? 'investor' : 'entrepreneur';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [meetingsData, peopleData] = await Promise.all([
        listMeetings(),
        listUsers(oppositeRole as 'investor' | 'entrepreneur'),
      ]);
      setMeetings(meetingsData);
      setPeople(peopleData);
    } catch (err) {
      toast.error('Could not load meetings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId || !startTime || !endTime || !title) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await createMeeting({
        participant: Number(participantId),
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      });
      toast.success('Meeting request sent!');
      setShowForm(false);
      setTitle(''); setDescription(''); setParticipantId(''); setStartTime(''); setEndTime('');
      loadData();
    } catch (err: any) {
      const message = err?.response?.data?.non_field_errors?.[0] || 'Could not schedule meeting — check for conflicts.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: number, action: 'accept' | 'reject' | 'cancel') => {
    try {
      await meetingAction(id, action);
      toast.success(`Meeting ${action}ed.`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || `Could not ${action} meeting.`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMeeting(id);
      toast.success('Meeting deleted.');
      loadData();
    } catch {
      toast.error('Could not delete meeting.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowForm(!showForm)}>
          Schedule Meeting
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">New Meeting Request</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSchedule} className="space-y-4">
              <Input
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meet with ({oppositeRole})
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  required
                >
                  <option value="">Select a person...</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.username}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start time"
                  type="datetime-local"
                  fullWidth
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <Input
                  label="End time"
                  type="datetime-local"
                  fullWidth
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" isLoading={submitting}>Send Request</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Your Meetings</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : meetings.length === 0 ? (
            <p className="text-gray-500 text-sm">No meetings yet — schedule one above.</p>
          ) : (
            <div className="space-y-3">
              {meetings.map((m) => {
                const isOrganizer = String(m.organizer.id) === user?.id;
                const otherPerson = isOrganizer ? m.participant_detail : m.organizer;

                return (
                  <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{m.title}</h3>
                          <Badge variant={statusVariant[m.status] || 'secondary'} size="sm">
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          With {otherPerson?.name || otherPerson?.email}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> {new Date(m.start_time).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(m.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {m.description && <p className="text-sm text-gray-600 mt-2">{m.description}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {m.status === 'pending' && !isOrganizer && (
                          <>
                            <Button size="sm" variant="success" leftIcon={<Check size={14} />} onClick={() => handleAction(m.id, 'accept')}>
                              Accept
                            </Button>
                            <Button size="sm" variant="error" leftIcon={<X size={14} />} onClick={() => handleAction(m.id, 'reject')}>
                              Reject
                            </Button>
                          </>
                        )}
                        {m.status === 'accepted' && (
                          <Button size="sm" leftIcon={<Video size={14} />} onClick={() => navigate(`/call/${m.room_name}`)}>
                            Join Call
                          </Button>
                        )}
                        {(m.status === 'pending' || m.status === 'accepted') && (
                          <Button size="sm" variant="outline" onClick={() => handleAction(m.id, 'cancel')}>
                            Cancel
                          </Button>
                        )}
                        {isOrganizer && (
                          <Button size="sm" variant="ghost" className="p-2 text-error-600" onClick={() => handleDelete(m.id)}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
