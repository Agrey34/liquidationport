'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../lib/api';

interface AppReview {
  id: string;
  product: string;
  productId: string;
  user: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
  status: string;
}

interface ReviewsResponse {
  data: AppReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    totalReviews: number;
    averageRating: number;
    fiveStarCount: number;
    recentReviews: number;
  };
}

const PAGE_SIZE = 10;

export default function ReviewsPage() {
  const [reviews, setReviews]       = useState<AppReview[]>([]);
  const [loading, setLoading]       = useState<boolean>(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [page, setPage]             = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [deleteTarget, setDeleteTarget] = useState<AppReview | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [kpis, setKpis] = useState({
    totalReviews: 0,
    averageRating: 5.0,
    fiveStarCount: 0,
    recentReviews: 0,
  });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (search.trim()) params.set('search', search.trim());
      if (ratingFilter !== 'all') params.set('rating', ratingFilter.toString());

      const queryStr = params.toString();
      const res = await apiFetch<AppReview[]>(`/reviews/admin${queryStr ? `?${queryStr}` : ''}`);
      const rawRes = res as unknown as ReviewsResponse;
      const reviewsList: AppReview[] = Array.isArray(res.data)
        ? (res.data as unknown as AppReview[])
        : (Array.isArray(rawRes?.data) ? rawRes.data : []);
      setReviews(reviewsList);
      setTotalPages(rawRes?.totalPages || 1);
      setTotalCount(rawRes?.total || reviewsList.length);
      if (rawRes?.kpis) {
        setKpis(rawRes.kpis);
      }
    } catch (err: unknown) {
      console.error('Failed to load reviews:', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to live reviews API.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, ratingFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchReviews();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/reviews/admin/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchReviews();
    } catch (err: unknown) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review on server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fiveStarPercent = kpis.totalReviews > 0
    ? Math.round((kpis.fiveStarCount / kpis.totalReviews) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Review Moderation</h2>
          <p className="text-neutral-500 mt-1">Live customer product ratings and reviews from the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <i className={`fi fi-rr-refresh text-base ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="fi fi-rr-triangle-warning text-lg shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReviews}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Total Reviews</p>
            <p className="text-2xl font-black text-neutral-900">{kpis.totalReviews}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{kpis.recentReviews} submitted in last 30 days</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <i className="fi fi-rr-comment-alt-middle text-2xl" />
          </div>
        </div>
        
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Average Store Rating</p>
            <p className="text-2xl font-black text-neutral-900 flex items-baseline gap-1">
              {kpis.averageRating.toFixed(1)} <span className="text-sm font-semibold text-neutral-400">/ 5.0</span>
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">Calculated across all customer reviews</p>
          </div>
          <div className="flex text-amber-400 text-lg gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <i
                key={i}
                className={`fi ${i + 1 <= Math.round(kpis.averageRating) ? 'fi-sr-star' : 'fi-rr-star text-neutral-300'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">5-Star Satisfaction</p>
            <p className="text-2xl font-black text-emerald-600">{fiveStarPercent}%</p>
            <p className="text-xs text-neutral-400 mt-0.5">{kpis.fiveStarCount} perfect score ratings</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <i className="fi fi-rr-shield-check text-2xl" />
          </div>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-neutral-50">
          <div className="relative flex-1 max-w-md">
            <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
            <input 
              type="text" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search product, comment, or user..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={ratingFilter}
              onChange={e => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setRatingFilter(val);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars Only</option>
              <option value="2">2 Stars Only</option>
              <option value="1">1 Star Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-75">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Rating</th>
                <th className="px-6 py-4 font-bold w-1/3">Review Comment</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-36 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-48 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-28 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="w-8 h-8 bg-neutral-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                        <i className="fi fi-rr-comment-alt text-xl" />
                      </div>
                      <p className="text-neutral-700 font-semibold">No product reviews found</p>
                      <p className="text-neutral-400 text-sm">Customer feedback will appear here as orders are reviewed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-neutral-900 truncate max-w-50">
                      {review.product}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i
                            key={i}
                            className={`fi ${i < review.rating ? 'fi-sr-star' : 'fi-rr-star text-neutral-300'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 italic">
                      {review.comment ? `"${review.comment}"` : <span className="text-neutral-400 not-italic">No comment left</span>}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs truncate max-w-37.5">
                      {review.user}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 whitespace-nowrap text-xs font-mono">
                      {review.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setDeleteTarget(review)}
                          title="Delete / Remove review"
                          className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors flex items-center justify-center border border-rose-200"
                        >
                          <i className="fi fi-rr-trash text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            Showing{' '}
            <span className="font-semibold text-neutral-900">
              {totalCount === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-neutral-900">{totalCount}</span> reviews
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="fi fi-rr-angle-left text-base flex items-center justify-center" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                  n === page ? 'bg-neutral-900 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="fi fi-rr-angle-right text-base flex items-center justify-center" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="fi fi-rr-triangle-warning text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Delete Review</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Are you sure you want to remove this review for <span className="font-semibold text-neutral-800">{deleteTarget.product}</span>? The product rating average will be automatically recalculated.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl font-semibold text-sm hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
