import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import styles from './HeroCarousel.module.css';

interface Banner {
    id: string;
    image: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
}

const banners: Banner[] = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1400&h=380&fit=crop',
        title: 'Book Premium Turfs',
        subtitle: 'Find the best turfs in your city with exclusive offers',
        ctaText: 'Book Now',
        ctaLink: '/listings',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1400&h=380&fit=crop',
        title: 'Football Season Special',
        subtitle: 'Get 20% off on all 7-a-side football turfs this weekend',
        ctaText: 'Explore Offers',
        ctaLink: '/listings?sport=football',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1400&h=380&fit=crop',
        title: 'Cricket Nets Available',
        subtitle: 'Practice your skills at state-of-the-art cricket facilities',
        ctaText: 'View Cricket Turfs',
        ctaLink: '/listings?sport=cricket',
    },
    {
        id: '4',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&h=380&fit=crop',
        title: 'New Basketball Courts',
        subtitle: 'Air-conditioned indoor courts now available for booking',
        ctaText: 'Book Courts',
        ctaLink: '/listings?sport=basketball',
    },
];

export function HeroCarousel() {
    const handleCtaClick = (link: string) => {
        window.location.href = link;
    };

    return (
        <div className={styles.carouselContainer}>
            <Swiper
                modules={[Autoplay, Pagination, Navigation, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}
                pagination={{
                    clickable: true,
                    bulletClass: styles.paginationBullet,
                    bulletActiveClass: styles.paginationBulletActive,
                }}
                navigation={{
                    nextEl: `.${styles.navButtonNext}`,
                    prevEl: `.${styles.navButtonPrev}`,
                }}
                loop={true}
                speed={600}
                className={styles.swiper}
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                        <div className={styles.slide}>
                            {/* Background Image */}
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className={styles.slideImage}
                            />

                            {/* Gradient Overlay */}
                            <div className={styles.gradientOverlay} />

                            {/* Content */}
                            <div className={styles.slideContent}>
                                <h2 className={styles.slideTitle}>{banner.title}</h2>
                                <p className={styles.slideSubtitle}>{banner.subtitle}</p>
                                <button
                                    className={styles.ctaButton}
                                    onClick={() => handleCtaClick(banner.ctaLink)}
                                >
                                    {banner.ctaText}
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Buttons */}
            <button className={`${styles.navButton} ${styles.navButtonPrev}`} aria-label="Previous slide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button className={`${styles.navButton} ${styles.navButtonNext}`} aria-label="Next slide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}
