import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { FileText, Search, Calendar, User } from 'lucide-react';

export const AdminDocumentsPage = () => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/documents', {
        search,
        type: typeFilter,
        page
      });
      if (res.success) {
        setDocuments(res.documents || []);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch documents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>System Document Registry</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Global overview of all active and expiring documents across registered customer accounts
        </p>
      </div>

      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <form onSubmit={handleSearch} style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, doc number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Document Type:
          </span>
          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="all">All Types</option>
            <option value="Driving Licence">Driving Licence</option>
            <option value="Passport">Passport</option>
            <option value="Vehicle Insurance">Vehicle Insurance</option>
            <option value="RC">RC</option>
            <option value="Certificate">Certificate</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: '52px' }} />
            ))}
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: 'var(--text-muted)' }}>No documents found matching the criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Owner / Customer</th>
                <th>Type</th>
                <th>Doc Number</th>
                <th>Expiry Date</th>
                <th>Calculated State</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{doc.title}</div>
                    {doc.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {doc.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} color="var(--primary)" />
                      <span style={{ fontWeight: '500' }}>{doc.userId?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      +91 {doc.userId?.phone}
                    </div>
                  </td>
                  <td>{doc.documentType === 'Custom' ? doc.customTypeName : doc.documentType}</td>
                  <td>
                    <code style={{ fontSize: '0.85rem' }}>{doc.documentNumber || '—'}</code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>
                        {new Date(doc.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge state={doc.state} daysRemaining={doc.daysRemaining} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
