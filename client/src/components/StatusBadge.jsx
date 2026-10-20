import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Smartphone, ShieldCheck, Ban } from 'lucide-react';

export const StatusBadge = ({ state, status, daysRemaining }) => {
  const current = state || status;

  if (current === 'Valid') {
    return (
      <span className="badge badge-valid">
        <CheckCircle2 size={13} />
        Valid ({daysRemaining}d left)
      </span>
    );
  }

  if (current === 'Expiring Soon') {
    return (
      <span className="badge badge-expiring">
        <Clock size={13} />
        Expiring Soon ({daysRemaining}d left)
      </span>
    );
  }

  if (current === 'Expired') {
    return (
      <span className="badge badge-expired">
        <AlertTriangle size={13} />
        Expired ({Math.abs(daysRemaining)}d ago)
      </span>
    );
  }

  if (current === 'Renewed') {
    return (
      <span className="badge badge-renewed">
        <RefreshCw size={13} />
        Renewed
      </span>
    );
  }

  if (current === 'simulated') {
    return (
      <span className="badge badge-simulated">
        <Smartphone size={13} />
        Simulated (Demo)
      </span>
    );
  }

  if (current === 'provider_accepted' || current === 'delivered') {
    return (
      <span className="badge badge-accepted">
        <ShieldCheck size={13} />
        Accepted
      </span>
    );
  }

  if (current === 'failed') {
    return (
      <span className="badge badge-failed">
        <AlertTriangle size={13} />
        Failed
      </span>
    );
  }

  if (current === 'active') {
    return (
      <span className="badge badge-active">
        Active
      </span>
    );
  }

  if (current === 'suspended') {
    return (
      <span className="badge badge-suspended">
        <Ban size={13} />
        Suspended
      </span>
    );
  }

  return <span className="badge badge-simulated">{current}</span>;
};
