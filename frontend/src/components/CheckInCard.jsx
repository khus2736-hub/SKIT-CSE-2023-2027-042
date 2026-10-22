import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/attendance';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatHours, formatStatus } from '../utils/formatters';

export default function CheckInCard({ onStatusChange }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const fetchToday = async () => {
    try {
      const data = await attendanceApi.getToday();
      setTodayRecord(data);
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const data = await attendanceApi.checkIn();
      setTodayRecord(data);
      showToast('Checked in successfully!', 'success');
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-in failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const data = await attendanceApi.checkOut();
      setTodayRecord(data);
      showToast('Checked out successfully!', 'success');
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-out failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>Loading attendance status...</div>;
  }

  const isCheckedIn = Boolean(todayRecord?.checkIn);
  const isCheckedOut = Boolean(todayRecord?.checkOut);

  return (
    <div className="checkin-card">
      <div className="checkin-info">
        <h3>Today's Attendance</h3>
        {!isCheckedIn && <p>You have not marked check-in for today yet.</p>}
        {isCheckedIn && !isCheckedOut && (
          <p>
            Checked in at <strong>{formatDateTime(todayRecord.checkIn)}</strong>
            {todayRecord.late && <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Late</span>}
          </p>
        )}
        {isCheckedOut && (
          <p>
            Checked in at <strong>{formatDateTime(todayRecord.checkIn)}</strong> | Checked out at <strong>{formatDateTime(todayRecord.checkOut)}</strong> ({formatHours(todayRecord.workHours)} - {formatStatus(todayRecord.status)})
          </p>
        )}
      </div>

      <div className="checkin-actions">
        {!isCheckedIn && (
          <button
            className="btn btn-checkin"
            onClick={handleCheckIn}
            disabled={actionLoading}
          >
            {actionLoading ? 'Checking In...' : 'Check In Now'}
          </button>
        )}

        {isCheckedIn && !isCheckedOut && (
          <button
            className="btn btn-checkout"
            onClick={handleCheckOut}
            disabled={actionLoading}
          >
            {actionLoading ? 'Checking Out...' : 'Check Out Now'}
          </button>
        )}

        {isCheckedOut && (
          <button className="btn btn-secondary btn-sm" disabled style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', borderColor: 'transparent' }}>
            Day Completed
          </button>
        )}
      </div>
    </div>
  );
}
