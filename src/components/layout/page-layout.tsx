import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import styles from "./page-layout.module.css";

export type LayoutContext = "admin" | "student" | "marketing" | "auth" | "prose";
export type GridVariant = "balanced" | "focused" | "full";

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

type PageContainerProps = HTMLAttributes<HTMLElement> & {
  context?: LayoutContext;
};

export const PageContainer = forwardRef<HTMLElement, PageContainerProps>(
  function PageContainer(
    { children, className, context = "student", id = "main-content", ...props },
    ref,
  ) {
    return (
      <main
        {...props}
        ref={ref}
        id={id}
        className={joinClasses(styles.container, styles[context], className)}
        data-layout-context={context}
      >
        {children}
      </main>
    );
  },
);

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header {...props} className={joinClasses(styles.header, className)}>
      <div className={styles.headerCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

type ContentGridProps = HTMLAttributes<HTMLElement> & {
  variant?: GridVariant;
};

export function ContentGrid({
  children,
  className,
  variant = "balanced",
  ...props
}: ContentGridProps) {
  return (
    <section
      {...props}
      className={joinClasses(styles.grid, styles[variant], className)}
    >
      {children}
    </section>
  );
}

export function ContextPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <aside {...props} className={joinClasses(styles.contextPanel, className)}>
      {children}
    </aside>
  );
}
