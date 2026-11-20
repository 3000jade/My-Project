import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ProfileCardStudio from './ProfileCardStudio';

function StudioHarness({ initialProfile, onSave = vi.fn() }) {
  const [draft, setDraft] = useState(initialProfile);
  const isDirty =
    draft.name !== initialProfile.name ||
    draft.bio !== initialProfile.bio ||
    draft.phone !== initialProfile.phone;

  return (
    <BrowserRouter>
      <ProfileCardStudio
        role="agent"
        title="Studio Test"
        subtitle="Testing 60/40 studio"
        profile={initialProfile}
        draft={draft}
        onDraftChange={setDraft}
        onSave={onSave}
        onDiscard={() => setDraft(initialProfile)}
        isDirty={isDirty}
      />
    </BrowserRouter>
  );
}

describe('ProfileCardStudio', () => {
  const baseProfile = {
    id: 'user-1',
    name: 'Elena Rossi',
    email: 'elena@pt.com',
    phone: '+63 917 555 0192',
    bio: 'Luxury real estate advisor.',
    prc_license_no: 'PRC-REB-0028491',
    dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
  };

  it('syncs editor changes to the live preview card and reveals Save/Discard bar', async () => {
    const handleSave = vi.fn();
    render(<StudioHarness initialProfile={baseProfile} onSave={handleSave} />);

    expect(screen.getByTestId('live-public-card-preview')).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Elena Rossi-Vance' } });

    expect(screen.getByText('Elena Rossi-Vance')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Unsaved Draft')).toBeInTheDocument();
    });
    expect(screen.getByTestId('studio-save-bar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Elena Rossi-Vance' })
    );
  });

  it('discards unsaved changes and resets preview back to saved profile', async () => {
    render(<StudioHarness initialProfile={baseProfile} />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Temporary Name' } });
    expect(screen.getByText('Temporary Name')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Discard/i }));
    await waitFor(() => {
      expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
      expect(screen.queryByTestId('studio-save-bar')).not.toBeInTheDocument();
    });
  });

  it('highlights bio character counter in coral warning style at >= 90% capacity', () => {
    render(<StudioHarness initialProfile={baseProfile} />);

    const bioInput = screen.getByLabelText(/Professional Bio/i);
    fireEvent.change(bioInput, { target: { value: 'A'.repeat(920) } });

    const counter = screen.getByTestId('bio-char-counter');
    expect(counter).toHaveTextContent('920 / 1000');
    expect(counter.className).toContain('text-accent');
  });

  it('toggles between Full Card and Compact card view modes', async () => {
    render(<StudioHarness initialProfile={baseProfile} />);

    expect(screen.getByText(/Public-safe view: license expiry dates stay private/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Compact/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Public-safe view: license expiry dates stay private/i)).not.toBeInTheDocument();
    });
  });
});
