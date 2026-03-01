import { motion } from 'framer-motion';
import { ReactNode, Children } from 'react';
import { cn } from '@/lib/utils';

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child animation in seconds */
  staggerDelay?: number;
}

const containerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

export function StaggerList({ children, className, staggerDelay = 0.07 }: StaggerListProps) {
  return (
    <motion.div
      className={cn('space-y-4', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={staggerDelay}
    >
      {Children.map(children, (child) =>
        child ? (
          <motion.div variants={itemVariants}>{child}</motion.div>
        ) : null
      )}
    </motion.div>
  );
}
