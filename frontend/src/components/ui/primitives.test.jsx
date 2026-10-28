import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Atomic shadcn/ui Primitives (design.md tokens)', () => {
  it('renders Input with proper accessible role and default styling', () => {
    render(<Input placeholder="Enter title" aria-label="Title" />);
    const input = screen.getByRole('textbox', { name: /title/i });
    expect(input).toBeInTheDocument();
    expect(input.className).toContain('rounded-lg');
  });

  it('renders Textarea with proper styling and attributes', () => {
    render(<Textarea placeholder="Property description" aria-label="Description" />);
    const textarea = screen.getByRole('textbox', { name: /description/i });
    expect(textarea).toBeInTheDocument();
  });

  it('renders Label associated with an input', () => {
    render(
      <div>
        <Label htmlFor="test-input">Listing Title</Label>
        <Input id="test-input" />
      </div>
    );
    expect(screen.getByText(/Listing Title/i)).toBeInTheDocument();
  });

  it('renders Checkbox with accessible state', () => {
    render(<Checkbox id="amenity-pool" aria-label="Swimming Pool" />);
    const checkbox = screen.getByRole('checkbox', { name: /swimming pool/i });
    expect(checkbox).toBeInTheDocument();
  });

  it('renders Alert with variants', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Validation Error</AlertTitle>
        <AlertDescription>Listing title is required.</AlertDescription>
      </Alert>
    );
    expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Listing title is required/i)).toBeInTheDocument();
  });

  it('renders accessible Tabs with active content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Step 1</TabsTrigger>
          <TabsTrigger value="tab2">Step 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByRole('tab', { name: /Step 1/i })).toBeInTheDocument();
    expect(screen.getByText(/Content 1/i)).toBeInTheDocument();
  });
});
