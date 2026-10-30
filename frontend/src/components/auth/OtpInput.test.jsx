import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OtpInput from './OtpInput';

describe('OtpInput Component', () => {
  it('renders 6 individual numeric input boxes', () => {
    render(<OtpInput value="" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    expect(inputs[0]).toHaveAttribute('aria-label', 'Digit 1 of 6');
    expect(inputs[5]).toHaveAttribute('aria-label', 'Digit 6 of 6');
  });

  it('populates inputs according to value prop', () => {
    render(<OtpInput value="1234" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('4');
    expect(inputs[4].value).toBe('');
    expect(inputs[5].value).toBe('');
  });

  it('calls onChange with updated string when digit is entered', () => {
    const handleChange = vi.fn();
    render(<OtpInput value="12" onChange={handleChange} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[2], { target: { value: '9' } });
    expect(handleChange).toHaveBeenCalledWith('129');
  });

  it('handles paste event with complete 6-digit code', () => {
    const handleChange = vi.fn();
    const handleComplete = vi.fn();
    render(<OtpInput value="" onChange={handleChange} onComplete={handleComplete} />);
    const group = screen.getByRole('group');

    fireEvent.paste(group, {
      clipboardData: {
        getData: () => '987654',
      },
    });

    expect(handleChange).toHaveBeenCalledWith('987654');
    expect(handleComplete).toHaveBeenCalledWith('987654');
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<OtpInput value="" onChange={vi.fn()} disabled />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});
