import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Si se levanta e inclina un poco al pasar el mouse (por defecto sí). */
  lift?: boolean;
};

export default function Card({ className = "", lift = true, children, ...props }: CardProps) {
  return (
    <div
      className={`panel rounded-3xl p-6 ${
        lift
          ? "transition duration-300 ease-out hover:-translate-y-1.5 hover:rotate-1 hover:shadow-[0_18px_36px_-16px_rgba(169,133,245,0.7)]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
