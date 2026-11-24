import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CmsMediaField from './CmsMediaField';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    uploadMedia: vi.fn(),
  },
}));

describe('CmsMediaField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a live preview when an image URL is passed and clears on Remove', () => {
    const handleChange = vi.fn();
    render(
      <CmsMediaField
        id="banner-image"
        label="Banner Image"
        value="/api/drive/media/banner-1"
        onChange={handleChange}
      />
    );

    const preview = screen.getByAltText('Banner Image preview');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', '/api/drive/media/banner-1');

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('uploads a valid JPEG image and passes the returned URL to onChange', async () => {
    const handleChange = vi.fn();
    cmsService.uploadMedia.mockResolvedValue({
      url: '/api/drive/media/img-1',
      fileId: 'img-1',
      fileName: 'hero.jpg',
    });

    render(
      <CmsMediaField
        id="hero-image"
        label="Hero Image"
        value=""
        onChange={handleChange}
      />
    );

    const file = new File(['image-bytes'], 'hero.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('Upload image file');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(cmsService.uploadMedia).toHaveBeenCalledWith(file);
      expect(handleChange).toHaveBeenCalledWith('/api/drive/media/img-1');
    });
  });

  it('rejects an unsupported PDF file without calling uploadMedia', async () => {
    const handleChange = vi.fn();

    render(
      <CmsMediaField
        id="staff-photo"
        label="Staff Photo"
        value=""
        onChange={handleChange}
      />
    );

    const pdfFile = new File(['pdf-bytes'], 'brochure.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Upload image file');

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Please choose a JPG, PNG, WebP, or GIF image/i)
      ).toBeInTheDocument();
    });
    expect(cmsService.uploadMedia).not.toHaveBeenCalled();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
