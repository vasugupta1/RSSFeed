import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BulletList from './BulletList';

describe('BulletList Component', () => {
  it('should render null when items is null or undefined', () => {
    // @ts-expect-error - testing invalid prop inputs
    const { container } = render(<BulletList items={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render null when items is empty', () => {
    const { container } = render(<BulletList items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render list of items when provided', () => {
    const items = ['First summary bullet', 'Second summary bullet', 'Third summary bullet'];
    render(<BulletList items={items} />);

    // Assert that each bullet point is rendered in the list
    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });

    // Assert we have exactly 3 list items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });
});
