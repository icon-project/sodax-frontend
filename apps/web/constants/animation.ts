import { stagger } from 'motion/react';

export const headerVariants = {
  open: {
    opacity: 1,
    transition: { duration: 1, delay: 0.5 },
  },
  closed: {
    opacity: 0,
    transition: { duration: 1 },
  },
};

export const contentVariants = {
  open: {
    opacity: 1,
    transition: { duration: 3, delay: 0.5, y: { stiffness: 1000, velocity: -100 } },
    y: 0,
  },
  closed: {
    opacity: 0.5,
    transition: { duration: 1, y: { stiffness: 1000 } },
    y: '75vh',
  },
};

export const mainContentVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { delay: 0.5, duration: 0.3 },
      y: { delay: 0.5, duration: 0.2, velocity: -100 },
    },
  },
  closed: {
    opacity: 0.5,
    y: '75vh',
    transition: {
      duration: 1,
      y: { stiffness: 1000 },
    },
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

export const swapVariants = {
  open: {
    transition: { delayChildren: stagger(0.07, { startDelay: 0.2 }) },
  },
  closed: {
    transition: { delayChildren: stagger(0.05, { from: 'last' }) },
  },
};
