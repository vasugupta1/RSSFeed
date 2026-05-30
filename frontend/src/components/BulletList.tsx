import React from 'react';

/**
 * Simple component that receives an array of bullet point strings and renders them as a styled list.
 * It can be used to display the parsed content returned from the readability API.
 */
interface BulletListProps {
  /**
   * Array of bullet point text strings.
   */
  items: string[];
}

const BulletList: React.FC<BulletListProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc list-inside space-y-2 text-[17px] md:text-[18px] leading-relaxed text-secondary font-serif">
      {items.map((item, idx) => (
        <li key={idx} className="break-words">
          {item}
        </li>
      ))}
    </ul>
  );
};

export default BulletList;
