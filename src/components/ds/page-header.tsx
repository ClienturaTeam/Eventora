import { Link } from "@tanstack/react-router";
import React, { type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface Crumb {
  label: string;
  to?: string | undefined;
}

export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
  meta,
}: {
  title: string;
  description?: string | undefined;
  crumbs?: Crumb[] | undefined;
  actions?: ReactNode | undefined;
  meta?: ReactNode | undefined;
}) {
  return (
    <div className="space-y-4">
      {crumbs.length ? (
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                <BreadcrumbItem>
                  {crumb.to && i < crumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {i < crumbs.length - 1 ? <BreadcrumbSeparator /> : null}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:flex lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
          ) : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  padded = true,
  className,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  padded?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <section className={`card-surface overflow-hidden ${className || ""}`}>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-display truncate text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}
