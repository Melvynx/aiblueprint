import { ExternalLink } from "lucide-react";

type ReferenceGroup =
  | "Mobile-first app references"
  | "Mobile-native product references"
  | "Supporting product and desktop references";

type LandingReference = {
  slug: string;
  name: string;
  url: string;
  group: ReferenceGroup;
  category: string;
  useFor: string;
};

const references: LandingReference[] = [
  {
    slug: "capwords",
    name: "CapWords",
    url: "https://capwords.app/",
    group: "Mobile-first app references",
    category: "Language learning",
    useFor: "Soft consumer framing, editorial headline, tactile phone screenshots.",
  },
  {
    slug: "cal-ai",
    name: "Cal AI",
    url: "https://www.calai.app/",
    group: "Mobile-first app references",
    category: "AI health",
    useFor: "Instant photo-to-result promise and mobile conversion flow.",
  },
  {
    slug: "finch",
    name: "Finch",
    url: "https://finchcare.com/",
    group: "Mobile-first app references",
    category: "Self-care",
    useFor: "Emotional onboarding, playful companion, gentle retention loop.",
  },
  {
    slug: "opal",
    name: "Opal",
    url: "https://www.opal.so/",
    group: "Mobile-first app references",
    category: "Focus",
    useFor: "Quantified outcomes, strong install CTA, credibility stats.",
  },
  {
    slug: "locket",
    name: "Locket",
    url: "https://locket.camera/",
    group: "Mobile-first app references",
    category: "Social widget",
    useFor: "Simple friend loop and app-store-first positioning.",
  },
  {
    slug: "bereal",
    name: "BeReal",
    url: "https://bereal.com/",
    group: "Mobile-first app references",
    category: "Social",
    useFor: "Sparse mechanic-led positioning and community framing.",
  },
  {
    slug: "lapse",
    name: "Lapse",
    url: "https://www.lapse.com/",
    group: "Mobile-first app references",
    category: "Camera social",
    useFor: "Nostalgia-led positioning and friends-not-followers story.",
  },
  {
    slug: "paired",
    name: "Paired",
    url: "https://www.paired.com/",
    group: "Mobile-first app references",
    category: "Relationship wellness",
    useFor: "Warm habit-based copy and app-store trust cues.",
  },
  {
    slug: "bevel",
    name: "Bevel",
    url: "https://www.bevel.health/",
    group: "Mobile-first app references",
    category: "Health dashboard",
    useFor: "Premium health metrics and wearable-data storytelling.",
  },
  {
    slug: "structured",
    name: "Structured",
    url: "https://structured.app/",
    group: "Mobile-first app references",
    category: "Daily planner",
    useFor: "Calm Apple-native polish and clear device screenshots.",
  },
  {
    slug: "endel",
    name: "Endel",
    url: "https://endel.io/",
    group: "Mobile-first app references",
    category: "Sound wellness",
    useFor: "Immersive mood, science trust, sensory product story.",
  },
  {
    slug: "stoic",
    name: "Stoic",
    url: "https://www.getstoic.com/",
    group: "Mobile-first app references",
    category: "Journal",
    useFor: "Fast emotional benefit, privacy tone, calm rhythm.",
  },
  {
    slug: "howbout",
    name: "Howbout",
    url: "https://howbout.app/",
    group: "Mobile-first app references",
    category: "Social planning",
    useFor: "Friends/calendar mechanic and bright group-use cases.",
  },
  {
    slug: "daze",
    name: "Daze",
    url: "https://daze.chat/",
    group: "Mobile-first app references",
    category: "Messaging",
    useFor: "Expressive Gen Z visual identity and dynamic screenshots.",
  },
  {
    slug: "bend",
    name: "Bend",
    url: "https://bend.com/",
    group: "Mobile-first app references",
    category: "Fitness habit",
    useFor: "Simple daily routine promise and high-install social proof.",
  },
  {
    slug: "yuka",
    name: "Yuka",
    url: "https://yuka.io/en/",
    group: "Mobile-first app references",
    category: "Scanner utility",
    useFor: "One-action scan value and mission-led explanation.",
  },
  {
    slug: "plantin",
    name: "PlantIn",
    url: "https://myplantin.com/",
    group: "Mobile-first app references",
    category: "Plant care",
    useFor: "Photo diagnosis, friendly utility, before-and-after flow.",
  },
  {
    slug: "picturethis",
    name: "PictureThis",
    url: "https://www.picturethisai.com/",
    group: "Mobile-first app references",
    category: "AI identification",
    useFor: "Nature imagery plus instant scan promise.",
  },
  {
    slug: "alltrails",
    name: "AllTrails",
    url: "https://www.alltrails.com/",
    group: "Mobile-first app references",
    category: "Outdoor discovery",
    useFor: "Lifestyle imagery, map visuals, route and community proof.",
  },
  {
    slug: "sleep-cycle",
    name: "Sleep Cycle",
    url: "https://www.sleepcycle.com/",
    group: "Mobile-first app references",
    category: "Sleep tracking",
    useFor: "Calm health positioning and light data visualization.",
  },
  {
    slug: "clue",
    name: "Clue",
    url: "https://helloclue.com/",
    group: "Mobile-first app references",
    category: "Health tracking",
    useFor: "Trust, privacy, inclusive medical-adjacent copy.",
  },
  {
    slug: "paste",
    name: "Paste",
    url: "https://pasteapp.io/",
    group: "Mobile-native product references",
    category: "Clipboard",
    useFor: "Cross-device app story and clean pricing conversion.",
  },
  {
    slug: "things",
    name: "Things",
    url: "https://culturedcode.com/things/",
    group: "Mobile-native product references",
    category: "Productivity",
    useFor: "Native app polish, white space, elegant device screenshots.",
  },
  {
    slug: "craft",
    name: "Craft",
    url: "https://www.craft.do/",
    group: "Mobile-native product references",
    category: "Docs and notes",
    useFor: "Editorial layout and mixed device surfaces.",
  },
  {
    slug: "rotato",
    name: "Rotato",
    url: "https://rotato.app/",
    group: "Mobile-native product references",
    category: "Mockup tool",
    useFor: "High-impact phone mockups and 3D product presentation.",
  },
  {
    slug: "superhuman",
    name: "Superhuman",
    url: "https://superhuman.com/",
    group: "Mobile-native product references",
    category: "Productivity",
    useFor: "Premium status, confident conversion copy, cross-surface product.",
  },
  {
    slug: "granola",
    name: "Granola",
    url: "https://www.granola.ai/",
    group: "Supporting product and desktop references",
    category: "AI productivity",
    useFor: "Warm AI productivity and human-centered copy.",
  },
  {
    slug: "screen-studio",
    name: "Screen Studio",
    url: "https://screen.studio/",
    group: "Supporting product and desktop references",
    category: "Mac video",
    useFor: "Dark demo-first hero, giant promise, centered product video.",
  },
  {
    slug: "raycast",
    name: "Raycast",
    url: "https://www.raycast.com/",
    group: "Supporting product and desktop references",
    category: "Mac productivity",
    useFor: "Premium dark polish and command-surface visuals.",
  },
  {
    slug: "linear",
    name: "Linear",
    url: "https://linear.app/",
    group: "Supporting product and desktop references",
    category: "Product development",
    useFor: "Precision storytelling, disciplined dark UI, section rhythm.",
  },
  {
    slug: "cursor",
    name: "Cursor",
    url: "https://cursor.com/",
    group: "Supporting product and desktop references",
    category: "Developer AI",
    useFor: "Dense product proof, direct value proposition, code visuals.",
  },
  {
    slug: "cleanshot",
    name: "CleanShot X",
    url: "https://cleanshot.com/",
    group: "Supporting product and desktop references",
    category: "Mac utility",
    useFor: "Crisp product demos and proof-point testimonials.",
  },
  {
    slug: "pixelsnap",
    name: "PixelSnap",
    url: "https://pixelsnap.com/",
    group: "Supporting product and desktop references",
    category: "Mac utility",
    useFor: "Concise promise, before-and-after demo, focused pricing.",
  },
  {
    slug: "arc",
    name: "Arc",
    url: "https://arc.net/",
    group: "Supporting product and desktop references",
    category: "Browser",
    useFor: "Expressive launch energy and product-led narrative.",
  },
  {
    slug: "dia",
    name: "Dia",
    url: "https://www.diabrowser.com/",
    group: "Supporting product and desktop references",
    category: "AI browser",
    useFor: "Modern waitlist CTA and polished AI positioning.",
  },
  {
    slug: "spline",
    name: "Spline",
    url: "https://spline.design/",
    group: "Supporting product and desktop references",
    category: "Creative tool",
    useFor: "Immersive visual canvas and strong gallery proof.",
  },
  {
    slug: "rive",
    name: "Rive",
    url: "https://rive.app/",
    group: "Supporting product and desktop references",
    category: "Animation tool",
    useFor: "Live examples, motion language, proof-heavy sections.",
  },
  {
    slug: "tella",
    name: "Tella",
    url: "https://www.tella.com/",
    group: "Supporting product and desktop references",
    category: "Screen recording",
    useFor: "Creator workflow proof and demo-led hero.",
  },
  {
    slug: "screen-charm",
    name: "Screen Charm",
    url: "https://screencharm.com/",
    group: "Supporting product and desktop references",
    category: "Screen recording",
    useFor: "Practical demo sections and founder/developer messaging.",
  },
  {
    slug: "glaze",
    name: "Glaze",
    url: "https://www.glaze.app/",
    group: "Supporting product and desktop references",
    category: "AI desktop app",
    useFor: "Dark OS-native mood and local-first trust points.",
  },
  {
    slug: "mouseless",
    name: "Mouseless",
    url: "https://mouseless.click/",
    group: "Supporting product and desktop references",
    category: "Mac utility",
    useFor: "Playful education, concise promise, distinctive tone.",
  },
  {
    slug: "hot-corners",
    name: "Hot Corners",
    url: "https://hot-corners.com/",
    group: "Supporting product and desktop references",
    category: "Mac utility",
    useFor: "Fun one-page personality and colorful interaction cues.",
  },
];

const groups: ReferenceGroup[] = [
  "Mobile-first app references",
  "Mobile-native product references",
  "Supporting product and desktop references",
];

export function LandingReferenceGrid() {
  return (
    <div className="not-typography mt-8 w-full space-y-10 lg:relative lg:left-1/2 lg:w-[min(calc(100vw-36rem),58rem)] lg:-translate-x-1/2 xl:w-[min(calc(100vw-38rem),66rem)]">
      {groups.map((group) => {
        const groupReferences = references.filter((item) => item.group === group);

        return (
          <section key={group} className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-foreground text-xl font-semibold tracking-normal">
                {group}
              </h2>
              <p className="text-muted-foreground text-sm">
                {group === "Supporting product and desktop references"
                  ? "These are not mobile-app-first sites. Keep them for hero rhythm, product proof, motion, and premium polish only."
                  : "Use these first when designing mobile app landing pages."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groupReferences.map((reference) => (
                <a
                  key={reference.slug}
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border bg-card text-card-foreground group flex min-w-0 flex-col overflow-hidden rounded-lg border no-underline transition-colors hover:border-muted-foreground/30"
                >
                  <div className="bg-muted aspect-[1.44/1] overflow-hidden border-b">
                    <img
                      src={`/landing-page/screenshots/${reference.slug}.jpg`}
                      alt={`${reference.name} landing page screenshot`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.015]"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-foreground truncate text-base font-semibold">
                          {reference.name}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {reference.category}
                        </p>
                      </div>
                      <ExternalLink className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {reference.useFor}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
