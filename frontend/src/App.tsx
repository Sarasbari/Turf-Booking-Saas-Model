import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollFramesHero } from "./components/ScrollFramesHero/ScrollFramesHero";
import { HeroContent } from "./components/HeroContent/HeroContent";
import { HeroSearch } from "./components/HeroSearch/HeroSearch";
import { TurfListings } from "./pages/TurfListings/TurfListings";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
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
          }
        />
        <Route path="/listings" element={<TurfListings />} />
      </Routes>
    </BrowserRouter>
  );
}
