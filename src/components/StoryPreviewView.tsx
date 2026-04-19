import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";

interface StoryPreviewViewProps {
  title: string;
  description: string;
  coverUrl: string;
  content: string;
  location?: string;
  tags?: string[];
  authorName?: string;
  authorUsername?: string;
}

function renderBody(body?: string): string {
  if (!body) return "";
  try {
    const json = JSON.parse(body);
    if (json.type === "doc") {
      return generateHTML(json, [StarterKit, ImageExt]);
    }
  } catch {}
  return body;
}

const StoryPreviewView = ({
  title, description, coverUrl, content, location, tags, authorName, authorUsername,
}: StoryPreviewViewProps) => {
  const html = renderBody(content);
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8">
      {coverUrl && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <img src={coverUrl} alt={title} className="w-full object-cover aspect-[2/1]" />
        </div>
      )}
      <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl leading-tight">{title || "Untitled story"}</h1>
      {description && (
        <p className="mb-4 text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {(authorName || authorUsername || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{authorName || authorUsername || "You"}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {location}
          </div>
        )}
      </div>
      {tags && tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 [&_img]:rounded-lg [&_img]:my-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
};

export default StoryPreviewView;
