import { stagger } from 'motion/react';

export const headerVariants = {
  open: {
    opacity: 1,
    transition: { duration: 1, delay: 0.5 },
  },
  closed: {
    opacity: 0,
    transition: { duration: 0.5 },
  },
};

export const contentVariants = {
  open: {
    opacity: 1,
    transition: {
      duration: 3,
      delay: 0.5,
      y: { stiffness: 1000, velocity: -100, ease: [0, 0.71, 0.2, 1.01], duration: 1 },
    },
    y: 0,
  },
  closed: {
    opacity: 1,
    transition: {
      duration: 3,
      y: { stiffness: 1000, duration: 1, ease: [0.8, -0.01, 0.29, 1] },
    },
    y: '75vh',
  },
};

export const mainContentVariants = {
  open: {
    opacity: 1,
    transition: {
      opacity: { delay: 0.3, duration: 0.2 },
      y: { delay: 0.3, velocity: -500, duration: 0.3 },
    },
    y: 0,
  },
  closed: {
    opacity: 1,
    transition: {
      duration: 3,
      y: { stiffness: 1000, duration: 1, delay: 0.1, ease: [0.8, -0.01, 0.29, 1] },
    },
    y: '75vh',
  },
};

export const itemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
};

export const listVariants = {
  open: {
    transition: { delayChildren: stagger(0.07, { startDelay: 0.2 }) },
  },
  closed: {
    transition: { delayChildren: stagger(0.05, { from: 'last' }) },
  },
};

export const accordionVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' as const },
  },
  open: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};
