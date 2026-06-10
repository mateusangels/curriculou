// Coluna de depoimentos em marquee vertical (adaptado para Vite + framer-motion).
import React from 'react';
import { motion } from 'framer-motion';

export interface Depoimento {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Depoimento[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{ duration: props.duration || 10, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5" key={i}>
                <div className="text-slate-700 dark:text-slate-200">{text}</div>
                <div className="mt-5 flex items-center gap-2">
                  <img width={40} height={40} src={image} alt={name} className="h-10 w-10 rounded-full" loading="lazy" />
                  <div className="flex flex-col">
                    <div className="font-medium leading-5 tracking-tight">{name}</div>
                    <div className="leading-5 tracking-tight opacity-60">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
