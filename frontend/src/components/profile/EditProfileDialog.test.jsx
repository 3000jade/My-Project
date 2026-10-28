import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EditProfileDialog from './EditProfileDialog';

describe('EditProfileDialog', () => {
  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter name' },
    { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '+63 917 ...' },
    { name: 'bio', label: 'Professional Bio', type: 'textarea', placeholder: 'Enter bio' },
  ];

  const initialData = {
    name: 'Carmela Santos',
    phone: '+63 917 555 1234',
    bio: 'Luxury real estate advisor in BGC.',
  };

  it('renders open dialog with title, description, and pre-filled inputs', () => {
    render(
      <EditProfileDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Edit Executive Profile"
        description="Update your contact information."
        initialData={initialData}
        fields={fields}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('Edit Executive Profile')).toBeInTheDocument();
    expect(screen.getByText('Update your contact information.')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Full Name/i);
    expect(nameInput).toHaveValue('Carmela Santos');

    const phoneInput = screen.getByLabelText(/Phone Number/i);
    expect(phoneInput).toHaveValue('+63 917 555 1234');
  });

  it('submits updated values with Coral Save CTA', () => {
    const handleSave = vi.fn();
    render(
      <EditProfileDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Edit Profile"
        initialData={initialData}
        fields={fields}
        onSave={handleSave}
      />
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Carmela Santos-Reyes' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Carmela Santos-Reyes',
        phone: '+63 917 555 1234',
      })
    );
  });
});
