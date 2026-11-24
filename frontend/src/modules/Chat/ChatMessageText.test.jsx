import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessageText from './ChatMessageText';

describe('ChatMessageText', () => {
  it('renders paragraphs with flex flex-col gap-2 and inline **bold** spans', () => {
    const { container } = render(
      <ChatMessageText
        text={'Here is **Serendra Two-Bedroom Suite** in **Taguig**.\n\nReady to schedule a viewing?'}
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).not.toBeNull();
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-col');
    expect(wrapper.className).toContain('gap-2');
    expect(wrapper.className).not.toContain('space-y-');

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[1].textContent).toBe('Ready to schedule a viewing?');

    const strongEls = container.querySelectorAll('strong');
    expect(strongEls).toHaveLength(2);
    expect(strongEls[0].textContent).toBe('Serendra Two-Bedroom Suite');
    expect(strongEls[0].className).toContain('font-semibold');
    expect(strongEls[0].className).toContain('text-[#1E293B]');
    expect(strongEls[1].textContent).toBe('Taguig');
  });

  it('renders bullet and numbered list blocks with list-disc pl-4 flex flex-col gap-1', () => {
    const text = [
      'Top options in BGC:',
      '- **Serendra** — PHP 24.5M',
      '* **One Uptown** — PHP 18M',
      '• **The Seasons** — PHP 28M',
      '1. Ask about **payment terms**',
    ].join('\n');

    const { container } = render(<ChatMessageText text={text} />);

    expect(screen.getByText('Top options in BGC:')).toBeInTheDocument();

    const list = container.querySelector('ul');
    expect(list).not.toBeNull();
    expect(list.className).toContain('list-disc');
    expect(list.className).toContain('pl-4');
    expect(list.className).toContain('flex');
    expect(list.className).toContain('flex-col');
    expect(list.className).toContain('gap-1');
    expect(list.className).not.toContain('space-y-');

    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toBe('Serendra — PHP 24.5M');
    expect(items[0].querySelector('strong')?.textContent).toBe('Serendra');
    expect(items[1].textContent).toBe('One Uptown — PHP 18M');
    expect(items[2].textContent).toBe('The Seasons — PHP 28M');
    expect(items[3].textContent).toBe('Ask about payment terms');
    expect(items[3].querySelector('strong')?.textContent).toBe('payment terms');
  });

  it('renders script and img HTML tags as harmless literal text nodes (XSS safe)', () => {
    const xssPayload =
      '<script>alert("xss")</script> <img src=x onerror=alert(1)> **<b>Safe Bold</b>**';

    const { container } = render(<ChatMessageText text={xssPayload} />);

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();

    expect(container.textContent).toContain('<script>alert("xss")</script>');
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');

    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong.textContent).toBe('<b>Safe Bold</b>');
  });

  it('returns null when text is empty or missing', () => {
    const { container: emptyContainer } = render(<ChatMessageText text="   " />);
    expect(emptyContainer.firstChild).toBeNull();

    const { container: nullContainer } = render(<ChatMessageText text={null} />);
    expect(nullContainer.firstChild).toBeNull();
  });
});
