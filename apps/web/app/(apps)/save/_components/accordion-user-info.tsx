import { motion } from 'motion/react';

export default function AccordionUserInfo({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      className="content-stretch flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, delay: isVisible ? 0.15 : 0 }}
    >
      <p className="font-['InterRegular'] font-bold leading-[1.4] relative shrink-0 text-clay !text-(length:--body-small)">
        237
      </p>
      <p className="font-['InterRegular'] font-medium leading-[1.2] relative shrink-0 text-clay-light !text-[9px]">
        USERS
      </p>
    </motion.div>
  );
}
