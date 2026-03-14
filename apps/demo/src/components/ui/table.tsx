import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ============================================================================
 * TABLE COMPONENT SYSTEM
 * ============================================================================
 *
 * A reusable table component system built with React forwardRef pattern.
 * Supports two modes:
 *
 * 1. STANDARD MODE (unstyled=false, default):
 *    - Table wrapped in a div with overflow-auto
 *    - Good for simple tables that manage their own scrolling
 *    - Example: <Table><TableHeader>...</TableHeader></Table>
 *
 * 2. UNSTYLED MODE (unstyled=true):
 *    - Raw <table> element without wrapper
 *    - Parent controls scrolling and positioning
 *    - Required for sticky headers with custom scroll containers
 *    - Example: <div className="overflow-y-auto"><Table unstyled>...</Table></div>
 *
 * WHY UNSTYLED MODE EXISTS:
 * - CSS sticky positioning requires direct relationship with scroll container
 * - Built-in wrapper creates nested scroll containers that break sticky behavior
 * - Use unstyled when you need sticky headers or custom scroll behavior
 * ============================================================================
 */

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Additional classes for the wrapper div (only applies when unstyled=false) */
  containerClassName?: string;

  /**
   * When true, removes the built-in overflow wrapper to allow parent control.
   *
   * USE CASES FOR UNSTYLED MODE:
   * - Sticky table headers (position: sticky needs direct scroll parent)
   * - Custom scroll containers with max-height
   * - Tables inside modals/dialogs with their own scroll logic
   *
   * STANDARD MODE (unstyled=false):
   * - Simple tables without sticky headers
   * - Tables that manage their own overflow
   *
   * @default false
   */
  unstyled?: boolean;
}

/**
 * TABLE - Main table component
 *
 * STRUCTURE:
 * - unstyled=false: <div className="overflow-auto"><table>...</table></div>
 * - unstyled=true: <table>...</table>
 */
const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, unstyled = false, ...props }, ref) => {
    // The actual <table> element with base styles
    // - w-full: Full width of container
    // - caption-bottom: Positions <caption> elements below table
    // - text-sm: Small text size (14px typically)
    const table = <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />;

    // UNSTYLED MODE: Return raw table, parent controls everything
    if (unstyled) {
      return table;
    }

    // STANDARD MODE: Wrap table in scroll container
    // - relative: For absolute positioning of child elements if needed
    // - w-full: Container takes full width
    // - overflow-auto: Shows scrollbars when content overflows
    return <div className={cn('relative w-full overflow-auto', containerClassName)}>{table}</div>;
  },
);
Table.displayName = 'Table';

/**
 * TABLE HEADER - <thead> wrapper
 *
 * STRUCTURE: <thead><tr><th>...</th></tr></thead>
 *
 * DEFAULT BEHAVIOR:
 * - [&_tr]:border-b: All <tr> children get bottom border
 *
 * STICKY HEADER USAGE:
 * Apply sticky positioning to <TableHead> cells, not <TableHeader>:
 * ✅ <TableHead className="sticky top-0">Header</TableHead>
 * ❌ <TableHeader className="sticky top-0">...</TableHeader>
 */
const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
);
TableHeader.displayName = 'TableHeader';

/**
 * TABLE BODY - <tbody> wrapper
 *
 * STRUCTURE: <tbody><tr><td>...</td></tr></tbody>
 *
 * DEFAULT BEHAVIOR:
 * - [&_tr:last-child]:border-0: Last row has no bottom border (cleaner look)
 */
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

/**
 * TABLE FOOTER - <tfoot> wrapper
 *
 * STRUCTURE: <tfoot><tr><td>...</td></tr></tfoot>
 *
 * DEFAULT BEHAVIOR:
 * - border-t: Top border to separate from body
 * - bg-muted/50: Subtle background color (50% opacity muted color)
 * - font-medium: Medium font weight for emphasis
 * - last:[&>tr]:border-b-0: Last row has no bottom border
 */
const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('border-t bg-muted/50 font-medium last:[&>tr]:border-b-0', className)} {...props} />
  ),
);
TableFooter.displayName = 'TableFooter';

/**
 * TABLE ROW - <tr> wrapper
 *
 * STRUCTURE: <tr><td>...</td> or <th>...</th></tr>
 *
 * DEFAULT BEHAVIOR:
 * - border-b: Bottom border between rows
 * - transition-colors: Smooth color transitions for hover effects
 * - hover:bg-muted/50: Subtle background on hover
 * - data-[state=selected]:bg-muted: Background when row is selected
 *   (state is set via data-state attribute: <TableRow data-state="selected">)
 */
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

/**
 * TABLE HEAD - <th> cell for headers
 *
 * USAGE: Inside <TableHeader><TableRow>
 *
 * DEFAULT BEHAVIOR:
 * - h-12: Fixed height (48px)
 * - px-4: Horizontal padding
 * - text-left: Left-aligned text (override with className for center/right)
 * - align-middle: Vertically center content
 * - font-medium: Medium font weight
 * - text-muted-foreground: Muted text color
 * - [&:has([role=checkbox])]:pr-0: Remove right padding if contains checkbox
 *
 * STICKY HEADER PATTERN:
 * <TableHead className="sticky top-0 z-10 bg-white">
 *   Header Text
 * </TableHead>
 *
 * CRITICAL FOR STICKY:
 * - sticky top-0: Stick to top of scroll container
 * - z-10 (or higher): Stay above table body content
 * - bg-white (or your bg color): Prevent content showing through when scrolling
 */
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

/**
 * TABLE CELL - <td> cell for data
 *
 * USAGE: Inside <TableBody><TableRow>
 *
 * DEFAULT BEHAVIOR:
 * - p-4: Padding on all sides
 * - align-middle: Vertically center content
 * - [&:has([role=checkbox])]:pr-0: Remove right padding if contains checkbox
 */
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('py-4 px-3 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
  ),
);
TableCell.displayName = 'TableCell';

/**
 * TABLE CAPTION - <caption> for table description
 *
 * USAGE: Inside <Table> (appears below table by default due to caption-bottom)
 *
 * DEFAULT BEHAVIOR:
 * - mt-4: Top margin for spacing
 * - text-sm: Small text
 * - text-muted-foreground: Muted color
 *
 * ACCESSIBILITY:
 * Use for table descriptions that help screen readers understand table purpose
 */
const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';

/**
 * WHY THE PATTERN MATTERS:
 * - Parent div: Controls scroll (max-h-[400px] overflow-y-auto)
 * - Table unstyled: No wrapper, direct child of scroll container
 * - TableHead sticky: Can stick to scroll container's top edge
 * - Background color: Prevents content from showing through sticky header
 * - z-index: Keeps header above scrolling body content
 * ============================================================================
 */

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
