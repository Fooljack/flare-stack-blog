import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { featuredPostsQuery } from "@/features/posts/queries";
import { canonicalLink } from "@/lib/seo";

const { featuredPostsLimit } = theme.config.home;

export const Route = createFileRoute("/_public/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      featuredPostsQuery(featuredPostsLimit),
    );

    return {
      canonicalHref: "/",
    };
  },
  head: ({ loaderData }) => ({
    links: [canonicalLink(loaderData?.canonicalHref ?? "/")],
  }),
  pendingComponent: HomePageSkeleton,
  component: HomeRoute,
});

function HomeRoute() {
  const { data: posts } = useSuspenseQuery(
    featuredPostsQuery(featuredPostsLimit),
  );
  return <theme.HomePage posts={posts} />;
}

function HomePageSkeleton() {
  return <theme.HomePageSkeleton />;
}
