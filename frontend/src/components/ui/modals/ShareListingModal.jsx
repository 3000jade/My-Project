import React, { useState, useRef } from 'react';
import { Link2, Check, Plus, X, Mail, Send, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../dialog';
import { Button } from '../button';
import apiClient from '@/services/apiClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 5;

const PLACEHOLDER_CHANNELS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export function buildShareListingUrl(listingId, channel = 'copy_link') {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/properties/${encodeURIComponent(listingId)}?utm_source=${encodeURIComponent(channel)}&utm_medium=share`;
}

export default function ShareListingModal({ open, onOpenChange, listing }) {
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [note, setNote] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [comingSoonChannel, setComingSoonChannel] = useState(null);
  const fallbackInputRef = useRef(null);

  if (!listing) return null;

  const listingId = listing.id || listing.listingKey;
  const title = listing.title || listing.listing_title || 'Featured Property';
  const price =
    listing.formattedPrice ||
    (typeof listing.price === 'number' && listing.price > 0
      ? `₱ ${listing.price.toLocaleString('en-PH')}`
      : listing.price || 'Price on Request');
  const address =
    listing.address ||
    listing.location_display ||
    [listing.city, listing.province].filter(Boolean).join(', ') ||
    'Metro Manila, Philippines';
  const image =
    listing.coverImage ||
    listing.mainImage ||
    listing.image ||
    (Array.isArray(listing.images) && listing.images[0]) ||
    '';
  const shareUrl = buildShareListingUrl(listingId, 'copy_link');

  const addEmailChip = (rawValue) => {
    const trimmed = String(rawValue ?? emailInput).trim().replace(/,+$/, '');
    if (!trimmed) return;

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (recipients.includes(trimmed.toLowerCase())) {
      setEmailError('Email already added.');
      return;
    }
    if (recipients.length >= MAX_RECIPIENTS) {
      setEmailError(`Maximum of ${MAX_RECIPIENTS} recipients allowed per send.`);
      return;
    }

    setRecipients((prev) => [...prev, trimmed.toLowerCase()]);
    setEmailInput('');
    setEmailError('');
    setSendSuccess('');
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmailChip(emailInput);
    }
  };

  const removeRecipient = (emailToRemove) => {
    setRecipients((prev) => prev.filter((r) => r !== emailToRemove));
    setEmailError('');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (fallbackInputRef.current) {
        fallbackInputRef.current.select();
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (fallbackInputRef.current) {
        fallbackInputRef.current.select();
      }
    }
  };

  const handleSendEmails = async (e) => {
    e.preventDefault();
    const pending = emailInput.trim().replace(/,+$/, '');
    let finalRecipients = [...recipients];

    if (pending) {
      if (!EMAIL_REGEX.test(pending)) {
        setEmailError('Enter a valid email address.');
        return;
      }
      if (!finalRecipients.includes(pending.toLowerCase())) {
        if (finalRecipients.length >= MAX_RECIPIENTS) {
          setEmailError(`Maximum of ${MAX_RECIPIENTS} recipients allowed per send.`);
          return;
        }
        finalRecipients.push(pending.toLowerCase());
      }
    }

    if (finalRecipients.length === 0) {
      setEmailError('Add at least one recipient email.');
      return;
    }

    setSending(true);
    setEmailError('');
    setSendSuccess('');
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `share-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      await apiClient.post(`/properties/${encodeURIComponent(listingId)}/share-email`, {
        recipients: finalRecipients,
        idempotency_key: idempotencyKey,
        optional_note: note.trim() || undefined,
        website: honeypot,
      });

      setRecipients([]);
      setEmailInput('');
      setNote('');
      setSendSuccess(`Listing queued for ${finalRecipients.length} recipient${finalRecipients.length > 1 ? 's' : ''}.`);
    } catch (err) {
      setEmailError(err?.data?.error || err?.message || 'Unable to send email right now.');
    } finally {
      setSending(false);
    }
  };

  const handlePlaceholderClick = (channel) => {
    setComingSoonChannel(channel.label);
    setTimeout(() => setComingSoonChannel(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E2E8F0] rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#1E293B]">
            <Share2 className="w-4 h-4 text-[#0F766E]" />
            <span>Share This Property</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Send a direct link or email this listing to up to {MAX_RECIPIENTS} recipients.
          </DialogDescription>
        </DialogHeader>

        {/* Listing Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-16 h-12 rounded-md object-cover shrink-0 border border-[#E2E8F0]"
            />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold font-mono text-[#0F766E] truncate">{price}</p>
            <p className="text-sm font-semibold text-[#1E293B] truncate">{title}</p>
            <p className="text-[11px] text-[#64748B] truncate">{address}</p>
          </div>
        </div>

        {/* Email Dispatch Form */}
        <form onSubmit={handleSendEmails} className="space-y-3">
          {/* Honeypot trap */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div className="space-y-1.5">
            <label htmlFor="share-email-input" className="block text-xs font-semibold text-[#1E293B]">
              Email Recipients ({recipients.length}/{MAX_RECIPIENTS})
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="share-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="friend@example.com"
                  className="w-full h-11 pl-9 pr-3 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addEmailChip(emailInput)}
                aria-label="Add recipient email"
                className="h-11 w-11 p-0 shrink-0"
              >
                <Plus className="w-4 h-4 text-[#1E293B]" />
              </Button>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-medium"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      aria-label={`Remove ${email}`}
                      className="hover:text-[#115E59] focus-visible:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {emailError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {emailError}
              </p>
            )}
            {sendSuccess && (
              <p role="status" className="text-xs font-medium text-[#0F766E]">
                {sendSuccess}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="share-optional-note" className="block text-xs font-semibold text-[#1E293B]">
              Personal Note <span className="text-[#64748B] font-normal">(optional)</span>
            </label>
            <textarea
              id="share-optional-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thought you might like this home..."
              className="w-full p-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder:text-[#64748B] resize-none focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
            />
          </div>

          <Button type="submit" loading={sending} className="w-full h-11">
            <Send className="w-4 h-4" />
            <span>Send Listing Email</span>
          </Button>
        </form>

        {/* Bottom Actions: Copy Link + Social Channel Placeholders (Excludes X/Twitter) */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
          <input
            ref={fallbackInputRef}
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Shareable property link"
            className="sr-only"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="h-11 px-4 gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-[#0F766E]">Link copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-[#64748B]" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-1.5">
              {PLACEHOLDER_CHANNELS.map((ch) => (
                <Button
                  key={ch.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlaceholderClick(ch)}
                  title={`${ch.label} — Coming Soon`}
                  className="h-11 px-2.5 text-[11px] text-[#64748B] border border-[#E2E8F0]"
                >
                  {ch.label}
                </Button>
              ))}
            </div>
          </div>
          {comingSoonChannel && (
            <p className="text-[11px] text-[#64748B] text-right">
              {comingSoonChannel} sharing — Coming Soon
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
