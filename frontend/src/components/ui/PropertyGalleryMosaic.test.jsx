import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PropertyGalleryMosaic from './PropertyGalleryMosaic';

describe('PropertyGalleryMosaic', () => {
  const images = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200'
  ];

  it('renders photo mosaic with View All Photos button', () => {
    render(<PropertyGalleryMosaic images={images} title="Urban Deca Homes Ortigas" />);

    expect(screen.getByRole('button', { name: /View All Photos/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(4);
  });

  it('opens lightbox dialog when View All Photos is clicked and closes on close button', async () => {
    render(<PropertyGalleryMosaic images={images} title="Urban Deca Homes Ortigas" />);

    const viewAllBtn = screen.getByRole('button', { name: /View All Photos/i });
    fireEvent.click(viewAllBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Close lightbox/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Close lightbox/i));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
