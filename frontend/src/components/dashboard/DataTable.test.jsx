import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable';

describe('DataTable Component', () => {
  const sampleColumns = [
    { header: 'Property', accessor: 'title' },
    { header: 'Location', accessor: 'location' },
    { header: 'Price', render: (row) => <span>₱{row.price.toLocaleString()}</span> }
  ];

  const sampleData = Array.from({ length: 25 }, (_, i) => ({
    id: `prop-${i + 1}`,
    title: `Luxury Villa ${i + 1}`,
    location: `Enclave ${i + 1}, Makati`,
    price: 50000000 + i * 1000000
  }));

  it('renders table headers and row items accurately', () => {
    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData.slice(0, 5)}
        pageSize={5}
      />
    );

    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Luxury Villa 1')).toBeInTheDocument();
    expect(screen.getByText('Luxury Villa 5')).toBeInTheDocument();
  });

  it('renders numbered pagination buttons matching mockup layout when items exceed pageSize', () => {
    const { container } = render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        pageSize={8}
      />
    );

    // 25 items / 8 per page = 4 pages (1, 2, 3, 4)
    expect(container.textContent).toContain('Showing 1 to 8 of 25 results');
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
  });

  it('switches page data and updates active page styling when clicking a page number', () => {
    const { container } = render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        pageSize={8}
      />
    );

    // Initial page: Villa 1 is present, Villa 9 is on page 2
    expect(screen.getByText('Luxury Villa 1')).toBeInTheDocument();
    expect(screen.queryByText('Luxury Villa 9')).toBeNull();

    // Click Page 2
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    // Page 2: Villa 9 is present, Villa 1 is gone
    expect(screen.queryByText('Luxury Villa 1')).toBeNull();
    expect(screen.getByText('Luxury Villa 9')).toBeInTheDocument();
    expect(container.textContent).toContain('Showing 9 to 16 of 25 results');
  });

  it('handles checkbox selection and select all', () => {
    const handleToggleSelect = vi.fn();
    const handleToggleSelectAll = vi.fn();

    const { container } = render(
      <DataTable
        columns={sampleColumns}
        data={sampleData.slice(0, 3)}
        selectable={true}
        selectedKeys={new Set(['prop-1'])}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(4); // 1 header + 3 rows

    // Click row 2 checkbox
    fireEvent.click(checkboxes[2]);
    expect(handleToggleSelect).toHaveBeenCalledWith('prop-2');

    // Click header select-all checkbox
    fireEvent.click(checkboxes[0]);
    expect(handleToggleSelectAll).toHaveBeenCalled();
  });

  it('applies responsive column classes when hideBelow is defined on a column', () => {
    const responsiveColumns = [
      { header: 'Property', accessor: 'title' },
      { header: 'Location', accessor: 'location', hideBelow: 'md' },
      { header: 'Price', accessor: 'price', hideBelow: 'lg' }
    ];

    const { container } = render(
      <DataTable
        columns={responsiveColumns}
        data={sampleData.slice(0, 2)}
      />
    );

    const headers = container.querySelectorAll('th');
    expect(headers[1].className).toContain('hidden md:table-cell');
    expect(headers[2].className).toContain('hidden lg:table-cell');

    const firstRowCells = container.querySelectorAll('tbody tr:first-child td');
    expect(firstRowCells[1].className).toContain('hidden md:table-cell');
    expect(firstRowCells[2].className).toContain('hidden lg:table-cell');
  });
});
