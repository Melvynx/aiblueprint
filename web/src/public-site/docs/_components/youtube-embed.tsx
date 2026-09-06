type YouTubeEmbedProps = {
  id: string;
  title?: string;
};

export function YouTubeEmbed({ id, title = "YouTube video" }: YouTubeEmbedProps) {
  return (
    <figure className="not-typography my-8 overflow-hidden rounded-xl border border-white/10 bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      </div>
    </figure>
  );
}
