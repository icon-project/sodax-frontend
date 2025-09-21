import type React from 'react';
import { Link } from 'react-router';
import { CloseIcon } from '@/components/icons';

const Sidebar = ({
  isOpen,
  toggle,
  setOpenRewardDialog,
}: {
  isOpen: boolean;
  toggle: () => void;
  setOpenRewardDialog: (open: boolean) => void;
}): React.ReactElement => {
  const handleOverlayInteraction = (e: React.MouseEvent | React.TouchEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <>
      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-99 transition-opacity duration-300 ease-in-out"
          onClick={handleOverlayInteraction}
          onMouseDown={handleOverlayInteraction}
          onTouchStart={handleOverlayInteraction}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-container fixed w-[295px] h-full overflow-hidden justify-center bg-cherry-soda grid pt-[180px] left-0 transition-transform duration-300 ease-in-out z-100 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onDragStart={e => e.preventDefault()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
      >
        <img className="absolute bottom-0 right-0 z-10" src="/circle4.png" alt="background" width={541} height={811} />
        <img
          className="mix-blend-lighten absolute bottom-0 right-0"
          src="/girl1.png"
          alt="background"
          width={541}
          height={811}
        />
        <button type="button" className="absolute left-[32px] top-[48px]" onClick={toggle}>
          {/* Close icon */}
          <CloseIcon width={24} height={24} fill="white" />
        </button>

        <ul className="sidebar-nav text-center leading-relaxed text-sm text-cream font-[InterRegular] space-y-6 z-20">
          <img src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="mx-auto mb-6" />
          <li>
            <Link
              href="#"
              onClick={() => {
                toggle();
                setOpenRewardDialog(true);
              }}
            >
              <p>Join waitlist</p>
            </Link>
          </li>
          <li>
            <Link href="#" onClick={toggle}>
              <p>About</p>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
