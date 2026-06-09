import { MDXRemote } from "next-mdx-remote/rsc";
import { Callout } from "./Callout";
import { Tabs, Tab } from "./Tabs";
import { ImageBlock } from "./ImageBlock";
import remarkGfm from "remark-gfm";

const components = {
  Callout,
  Tabs,
  Tab,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <ImageBlock
      src={props.src ?? ""}
      alt={props.alt ?? ""}
    />
  ),
};

interface MDXRendererProps {
  source: string;
  apiSlug?: string;
}

export function MDXRenderer({ source, apiSlug }: MDXRendererProps) {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </div>
  );
}
