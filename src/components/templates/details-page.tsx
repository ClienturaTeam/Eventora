import type { ReactNode } from "react";
import { Download, FileText, MessageSquare, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionCard, type Crumb } from "@/components/ds/page-header";
import { Timeline } from "@/components/ds/timeline";
import { MetricWidget } from "@/components/ds/stat-card";

export interface RelatedRecord {
  id: string;
  label: string;
  meta: string;
}

export function DetailsPageTemplate({
  title,
  description,
  crumbs,
  meta,
  actions,
  overview,
  metrics,
  related,
  relatedTitle = "Related records",
  timeline = [],
  attachments = [],
  comments = [],
  customTabs = [],
  customTabContents = [],
}: {
  title: string;
  description: string;
  crumbs: Crumb[];
  meta?: ReactNode;
  actions?: ReactNode;
  overview: ReactNode;
  metrics: { label: string; value: string; caption?: string }[];
  related?: RelatedRecord[];
  relatedTitle?: string;
  timeline?: any[];
  attachments?: any[];
  comments?: any[];
  customTabs?: { value: string; label: string }[];
  customTabContents?: { value: string; content: ReactNode }[];
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        crumbs={crumbs}
        meta={meta}
        actions={actions}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto scrollbar-none flex-nowrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {customTabs?.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {overview}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <SectionCard
                title="Activity timeline"
                description="Every state change on this record"
              >
                <Timeline items={timeline} />
              </SectionCard>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <SectionCard
                title="Attachments"
                description={`${attachments.length} files`}
                actions={
                  <Button size="sm" variant="outline" onClick={() => toast.info("Upload dialog")}>
                    <Paperclip className="h-3.5 w-3.5" />
                    Upload
                  </Button>
                }
                padded={false}
              >
                <ul className="divide-y divide-border">
                  {attachments.map((file) => (
                    <li
                      key={file.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type} · {file.size} · {file.uploaded}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Download ${file.name}`}
                        onClick={() => toast.success("Download started")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <SectionCard title="Comments" description={`${comments.length} threads`}>
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary-muted text-[11px] font-semibold text-accent-foreground">
                          {comment.author
                            .split(" ")
                            .map((p: string) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface/60 p-3">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                          <p className="truncate text-sm font-medium">
                            {comment.author}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {comment.role}
                            </span>
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {comment.time}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">{comment.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2">
                  <Textarea placeholder="Add an internal note…" rows={3} />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => toast.success("Comment posted")}>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Post comment
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
            
            {customTabContents?.map((tabContent) => (
              <TabsContent key={tabContent.value} value={tabContent.value} className="mt-4 space-y-6">
                {tabContent.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <aside className="space-y-6">
          <SectionCard title="Statistics" description="Live snapshot">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {metrics.map((metric) => (
                <MetricWidget key={metric.label} {...metric} />
              ))}
            </div>
          </SectionCard>

          {related && related.length > 0 && (
            <SectionCard title={relatedTitle} description={`${related.length} linked`} padded={false}>
              <ul className="divide-y divide-border">
                {related.map((record) => (
                  <li key={record.id} className="px-5 py-3">
                    <p className="truncate text-sm font-medium">{record.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{record.meta}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </aside>
      </div>
    </>
  );
}
