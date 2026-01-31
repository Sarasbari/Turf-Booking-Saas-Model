import { ScrollFramesHero } from "./components/ScrollFramesHero/ScrollFramesHero";
import { HeroContent } from "./components/HeroContent/HeroContent";
import { HeroSearch } from "./components/HeroSearch/HeroSearch";

export function App() {
  return (
    <div>
      <ScrollFramesHero
        frameCount={50}
        scrollPxPerFrame={12}
        easing={0.08}
        heroHeightVh={200}
      >
        <HeroContent
          title="TurfBookaro"
          subtitle="Book, Play, Enjoy"
        >
          <HeroSearch />
        </HeroContent>
      </ScrollFramesHero>


    </div>
  );
}
