import { doc, setDoc, addDoc, collection, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function seedTurf1() {
  try {
    // ── MAIN TURF DOCUMENT ──────────────────────────────────────
    const turfRef = doc(db, 'turf', '1');

    await setDoc(turfRef, {
      name: "Green Arena Turf",
      about: "Premium artificial grass turf perfect for 7-a-side football. Located in the heart of Andheri with easy access and ample parking. Features professional-grade floodlights for evening matches and well-maintained grounds year-round.",
      images: [
        "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
        "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800",
        "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800"
      ],
      pricePerHour: 600,
      status: "available",
      address: "Shop 5, Veera Desai Road, Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      geoPoint: new GeoPoint(19.1136, 72.8697),
      sports: ["Football", "Cricket"],
      groundSize: "7-a-side",
      totalGrounds: 2,
      amenities: [
        "Parking",
        "Floodlights",
        "Changing Room",
        "Washrooms",
        "Drinking Water",
        "First Aid Kit",
        "Seating Area"
      ],
      openTime: "06:00",
      closeTime: "23:00",
      weeklyOff: null,
      ownerId: "owner123",
      ownerName: "PlayGround Sports Pvt Ltd",
      ownerPhone: "+91 9876543210",
      rating: 4.5,
      totalReviews: 234,
      totalBookings: 1567,
      bookingsLast30Days: 89,
      isUnderMaintenance: false,
      maintenanceNote: "",
      isDiscountActive: true,
      discountPercent: 20,
      discountDescription: "Early Bird Offer - Book before 6 PM",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ Main turf document seeded!');

    const reviewsRef = collection(db, 'turf', '1', 'reviews');
    const sampleReviews = [
      {
        userId: "user001",
        userName: "Rahul Sharma",
        userPicture: "https://i.pravatar.cc/150?img=1",
        rating: 5,
        comment: "Amazing turf! Very well maintained with great floodlights. Highly recommended for evening matches.",
        isVerifiedBooking: true,
        timestamp: serverTimestamp()
      },
      {
        userId: "user002",
        userName: "Priya Patel",
        userPicture: "https://i.pravatar.cc/150?img=5",
        rating: 4,
        comment: "Good turf, clean facilities. Parking is very convenient. Will definitely come back!",
        isVerifiedBooking: true,
        timestamp: serverTimestamp()
      },
      {
        userId: "user003",
        userName: "Amit Kumar",
        userPicture: "https://i.pravatar.cc/150?img=3",
        rating: 5,
        comment: "Best turf in Andheri! Great ground size, excellent maintenance. The changing rooms are clean.",
        isVerifiedBooking: false,
        timestamp: serverTimestamp()
      }
    ];

    for (const review of sampleReviews) {
      await addDoc(reviewsRef, review);
    }

    console.log('✅ Reviews subcollection seeded!');
    console.log('🎉 All done! Go to /turf/1 to see your page.');
    return true;

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Rotating Unsplash turf images
const IMGS = [
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
];
const imgs = (i) => [IMGS[i % 6], IMGS[(i + 1) % 6], IMGS[(i + 2) % 6]];

const TURFS = [
  // ══════════════════════════════════════════════════════════
  // VIRAR – NALLASOPARA  (21 turfs, IDs 2-22)
  // ══════════════════════════════════════════════════════════
  {
    id:'2',  area:'Virar-Nallasopara',
    name:'Turf Arena Virar',
    address:'Narangi Bypass Rd, near Narangi, Virar West',
    city:'Virar', pin:'401303', lat:19.4599, lng:72.8081,
    phone:'9028445173', web:'https://turf-arena-virar.cricketground.in/',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1600',
  },
  {
    id:'3',  area:'Virar-Nallasopara',
    name:'Pro HDIL Turf',
    address:'HDIL Industrial Estate, Chandansar Road, Virar East',
    city:'Virar', pin:'401305', lat:19.4720, lng:72.8210,
    phone:'8888800000', web:'https://bit.ly/pro-hdil-turf',
    sports:['Football','Cricket'], price:600, range:'₹600–₹1500',
  },
  {
    id:'4',  area:'Virar-Nallasopara',
    name:"Smith's Turf Club",
    address:'Rajiv Gandhi Vidyalaya, Nilegaon, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4157, lng:72.7969,
    phone:'7774068899', web:'https://smithsturfclub.com/',
    sports:['Football','Cricket'], price:600, range:'₹600',
    disc:10, discNote:'Flat rate – No hidden charges!',
  },
  {
    id:'5',  area:'Virar-Nallasopara',
    name:"Abraham's Court",
    address:'Chakreshwar Talav, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4180, lng:72.7950,
    phone:'9029000000', web:'',
    sports:['Football','Cricket'], price:800, range:'₹800–₹1600',
  },
  {
    id:'6',  area:'Virar-Nallasopara',
    name:'Runbhumi Sports Turf',
    address:'Marambal Pada Road, near Sai Baba Mandir, Virar West',
    city:'Virar', pin:'401303', lat:19.4620, lng:72.8060,
    phone:'9819999222', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1500',
  },
  {
    id:'7',  area:'Virar-Nallasopara',
    name:'Sportsspark Turf Nallasopara',
    address:'St. Francis High School, 100 Ft Road, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4200, lng:72.8000,
    phone:'9833000000', web:'https://bit.ly/sportsspark-booking',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1400',
    disc:15, discNote:'Online Booking Discount',
  },
  {
    id:'8',  area:'Virar-Nallasopara',
    name:'Champions Arena',
    address:'Kamanwala Nagar, Datt Mandir Road, Virar West',
    city:'Virar', pin:'401303', lat:19.4650, lng:72.8090,
    phone:'9867000000', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1500',
  },
  {
    id:'9',  area:'Virar-Nallasopara',
    name:'Legends Turf',
    address:'Y K Nagar, Narangi Bypass Road, Virar West',
    city:'Virar', pin:'401303', lat:19.4610, lng:72.8075,
    phone:'9930000000', web:'',
    sports:['Football','Cricket'], price:700, range:'₹700–₹1400',
  },
  {
    id:'10', area:'Virar-Nallasopara',
    name:'Hat-Tricks Multi-Sport',
    address:'Bolinj Road, Near Agashi, Virar West',
    city:'Virar', pin:'401301', lat:19.4680, lng:72.7990,
    phone:'9029111111', web:'',
    sports:['Football','Cricket','Multi-sport'], price:600, range:'₹600–₹1300',
  },
  {
    id:'11', area:'Virar-Nallasopara',
    name:'Euphoria Sportz Turf',
    address:'Jyoti, Dhobi Talav, Agashi Road, Virar West',
    city:'Virar', pin:'401301', lat:19.4670, lng:72.7985,
    phone:'9029111111', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1600',
  },
  {
    id:'12', area:'Virar-Nallasopara',
    name:'United Sports Turf',
    address:'Sopara Gaon, Patil Wadi, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4190, lng:72.7960,
    phone:'9820000000', web:'https://bit.ly/united-turf-booking',
    sports:['Cricket','Football'], price:600, range:'₹600–₹1400',
  },
  {
    id:'13', area:'Virar-Nallasopara',
    name:'Urban Sports SKS',
    address:'Mothi Desai Gaon, Nallasopara East',
    city:'Nallasopara', pin:'401209', lat:19.4230, lng:72.8020,
    phone:'9324000000', web:'http://www.urbansports.in',
    sports:['Football','Cricket'], price:700, range:'₹700–₹1500',
  },
  {
    id:'14', area:'Virar-Nallasopara',
    name:'Shree Ram Exports Turf',
    address:'Golden Trade Center, Nallasopara East',
    city:'Nallasopara', pin:'401209', lat:19.4240, lng:72.8030,
    phone:'8850000000', web:'',
    sports:['Cricket'], price:500, range:'₹500–₹1200',
  },
  {
    id:'15', area:'Virar-Nallasopara',
    name:'Vighnaharta Cricket Field',
    address:'Santosh Bhavan, Nallasopara East',
    city:'Nallasopara', pin:'401209', lat:19.4245, lng:72.8035,
    phone:'9920000000', web:'',
    sports:['Cricket'], price:500, range:'₹500–₹1100',
  },
  {
    id:'16', area:'Virar-Nallasopara',
    name:'The Green Cage Turf',
    address:'Nirmal, Nala Sopara, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4165, lng:72.7975,
    phone:'9821000000', web:'',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1500',
  },
  {
    id:'17', area:'Virar-Nallasopara',
    name:'Shivaay Sports Arena',
    address:'Gomesali, Nala Sopara, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4170, lng:72.7980,
    phone:'9029222222', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1400',
  },
  {
    id:'18', area:'Virar-Nallasopara',
    name:'Playmakers Turf',
    address:'Gomes Ali Church Road, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4160, lng:72.7970,
    phone:'9167000000', web:'',
    sports:['Football','Cricket'], price:700, range:'₹700–₹1300',
  },
  {
    id:'19', area:'Virar-Nallasopara',
    name:'Yeshua Sports Turf',
    address:'Dhuri Complex, Virar West',
    city:'Virar', pin:'401303', lat:19.4630, lng:72.8070,
    phone:'9819000000', web:'',
    sports:['Multi-sport'], price:600, range:'₹600–₹1200',
  },
  {
    id:'20', area:'Virar-Nallasopara',
    name:'Collympic Ground',
    address:'Satpala Wagholi Road, Nallasopara West',
    city:'Nallasopara', pin:'401203', lat:19.4155, lng:72.7965,
    phone:'9324111111', web:'',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1400',
  },
  {
    id:'21', area:'Virar-Nallasopara',
    name:'Box Park Turf Virar',
    address:'Behind Rashmi Group Office, Vasai East/Virar',
    city:'Virar', pin:'401303', lat:19.4600, lng:72.8100,
    phone:'9167000000', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1600',
  },
  {
    id:'22', area:'Virar-Nallasopara',
    name:'24Seven Turf',
    address:'Bolinj, Virar West',
    city:'Virar', pin:'401303', lat:19.4690, lng:72.8000,
    phone:'9820111111', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },

  // ══════════════════════════════════════════════════════════
  // VASAI – NAIGAON  (18 turfs, IDs 23-40)
  // ══════════════════════════════════════════════════════════
  {
    id:'23', area:'Vasai-Naigaon',
    name:'Turf Legacy',
    address:'Merces, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3667, lng:72.8000,
    phone:'9000000001', web:'',
    sports:['Football','Cricket'], price:1200, range:'₹1200–₹1500',
  },
  {
    id:'24', area:'Vasai-Naigaon',
    name:'The Hobby Lobby',
    address:'Chulna Road, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3700, lng:72.8010,
    phone:'9000000002', web:'https://bit.ly/40D5QkE',
    sports:['Cricket','Football'], price:1000, range:'₹1000–₹1400',
  },
  {
    id:'25', area:'Vasai-Naigaon',
    name:'Score 365 Turf',
    address:'Suncity Gass Road, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3720, lng:72.7990,
    phone:'9000000003', web:'https://vasai.com/score-365-turf',
    sports:['Football','Cricket','Volleyball'], price:1000, range:'₹1000–₹1500',
    disc:10, discNote:'Weekend Morning Discount',
  },
  {
    id:'26', area:'Vasai-Naigaon',
    name:'The DEN Turf',
    address:'Vasai New Link Road, Vasai East',
    city:'Vasai', pin:'401208', lat:19.3800, lng:72.8100,
    phone:'9000000004', web:'https://the-den-turf.business.site',
    sports:['Football','Cricket','Multi-sport'], price:1200, range:'₹1200–₹1800',
    disc:20, discNote:'Early Bird – Book 3 days in advance',
  },
  {
    id:'27', area:'Vasai-Naigaon',
    name:'Bethel Sports Turf',
    address:'Madhuban Township, Vasai East',
    city:'Vasai', pin:'401208', lat:19.3810, lng:72.8110,
    phone:'9000000005', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1200',
  },
  {
    id:'28', area:'Vasai-Naigaon',
    name:'Sunteck WestWorld Turf',
    address:'Naigaon East',
    city:'Naigaon', pin:'401207', lat:19.3600, lng:72.8500,
    phone:'9000000006', web:'https://bit.ly/4hVzK7p',
    sports:['Football','Cricket'], price:400, range:'₹400–₹800',
    disc:10, discNote:'Most affordable turf in Naigaon!',
  },
  {
    id:'29', area:'Vasai-Naigaon',
    name:'Sportsspark Turf Vasai',
    address:'100 Ft Road, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3690, lng:72.8005,
    phone:'9000000007', web:'',
    sports:['Football','Cricket'], price:1000, range:'₹1000–₹2000',
  },
  {
    id:'30', area:'Vasai-Naigaon',
    name:'Box Park Turf Vasai',
    address:'Vasaivirar, Vasai East',
    city:'Vasai', pin:'401208', lat:19.3815, lng:72.8115,
    phone:'9000000008', web:'',
    sports:['Football','Cricket'], price:800, range:'₹800–₹1300',
  },
  {
    id:'31', area:'Vasai-Naigaon',
    name:'KOLLIDE Turf',
    address:'Umelman Road, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3680, lng:72.7980,
    phone:'9000000009', web:'https://kollide.in',
    sports:['Cricket'], price:900, range:'₹900–₹1400',
  },
  {
    id:'32', area:'Vasai-Naigaon',
    name:'JSR Cricket Ground',
    address:'Umelman, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3678, lng:72.7978,
    phone:'9000000010', web:'https://jsr-cricket-ground.in',
    sports:['Cricket'], price:800, range:'₹800–₹1100',
  },
  {
    id:'33', area:'Vasai-Naigaon',
    name:'Suvidha Astroturf',
    address:'Near Malungi Wadi, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3685, lng:72.7988,
    phone:'9000000011', web:'',
    sports:['Football'], price:1000, range:'₹1000–₹1500',
  },
  {
    id:'34', area:'Vasai-Naigaon',
    name:'Club De Amigos',
    address:'Chulne Actan, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3705, lng:72.8015,
    phone:'9000000012', web:'',
    sports:['Football','Cricket'], price:1100, range:'₹1100–₹1600',
  },
  {
    id:'35', area:'Vasai-Naigaon',
    name:'The Rayan Turf',
    address:'Golani Naka, Vasai East',
    city:'Vasai', pin:'401208', lat:19.3820, lng:72.8120,
    phone:'9000000013', web:'',
    sports:['Football'], price:800, range:'₹800–₹1200',
  },
  {
    id:'36', area:'Vasai-Naigaon',
    name:'Krishika Sports',
    address:'Gokhivare, Vasai East',
    city:'Vasai', pin:'401208', lat:19.3825, lng:72.8125,
    phone:'9000000014', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1200',
  },
  {
    id:'37', area:'Vasai-Naigaon',
    name:'Tivri Sports Ground',
    address:'Maryam Nagar, Naigaon East',
    city:'Naigaon', pin:'401207', lat:19.3610, lng:72.8510,
    phone:'9000000015', web:'',
    sports:['Cricket'], price:600, range:'₹600–₹1000',
  },
  {
    id:'38', area:'Vasai-Naigaon',
    name:'Seven Eleven Turf Naigaon',
    address:'Kanakia Road, Naigaon',
    city:'Naigaon', pin:'401207', lat:19.3615, lng:72.8515,
    phone:'9000000016', web:'https://sevenelevenclub.com',
    sports:['Football','Cricket','Multi-sport'], price:1200, range:'₹1200–₹2000',
    disc:15, discNote:'Group Booking Discount – 5+ players',
  },
  {
    id:'39', area:'Vasai-Naigaon',
    name:'The Cricket Turf',
    address:'Old Barampur, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3710, lng:72.8020,
    phone:'9000000017', web:'',
    sports:['Cricket'], price:900, range:'₹900–₹1300',
  },
  {
    id:'40', area:'Vasai-Naigaon',
    name:'Kabris Farm House',
    address:'Sandor, Vasai West',
    city:'Vasai', pin:'401202', lat:19.3715, lng:72.8025,
    phone:'9000000018', web:'',
    sports:['Football','Cricket'], price:1000, range:'₹1000–₹1500',
  },

  // ══════════════════════════════════════════════════════════
  // MIRA-BHAYANDAR  (29 turfs, IDs 41-69)
  // ══════════════════════════════════════════════════════════
  {
    id:'41', area:'Mira-Bhayandar',
    name:'Turfholic',
    address:'Maheshwari Bhavan Road, Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3000, lng:72.8500,
    phone:'9833535181', web:'https://cricheroes.com/cricket-ground-detail/357943/mira-bhayandar/turf-holic-turf-1',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1600',
  },
  {
    id:'42', area:'Mira-Bhayandar',
    name:'Chase Track Turf',
    address:'Maheshwari Bhavan, 150 Feet Rd, Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3010, lng:72.8510,
    phone:'9833535181', web:'https://chase-track-turf.cricketground.in/',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1800',
    disc:20, discNote:'Early Morning Discount (6–8 AM)',
  },
  {
    id:'43', area:'Mira-Bhayandar',
    name:'ISF Turfs',
    address:'Opp Gaurav Residency Ph 2, RBK School Rd, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2800, lng:72.8700,
    phone:'9004085444', web:'https://bit.ly/isf-turf-booking',
    sports:['Cricket','Football'], price:500, range:'₹500–₹1800',
  },
  {
    id:'44', area:'Mira-Bhayandar',
    name:'Seven Eleven Turf Mira Road',
    address:'Kanakia Rd, Next to 7/11 Club, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2820, lng:72.8720,
    phone:'9265203709', web:'https://bit.ly/711-turf-booking',
    sports:['Football'], price:800, range:'₹800–₹2000',
    disc:15, discNote:'Weekday Afternoon Special',
  },
  {
    id:'45', area:'Mira-Bhayandar',
    name:'Pavilion Arena',
    address:'15 No. Last Bus Stop, Unique Gardens, Ph 4, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2790, lng:72.8710,
    phone:'8450911925', web:'https://bit.ly/pavilion-turf-site',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1600',
  },
  {
    id:'46', area:'Mira-Bhayandar',
    name:'The Headquarters Mira Road',
    address:'Beverly Park, Near Kanakia Road, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2780, lng:72.8710,
    phone:'9167215161', web:'https://hudle.in/venues/the-headquarters',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1500',
  },
  {
    id:'47', area:'Mira-Bhayandar',
    name:'Lush Sports',
    address:'Opp Bhakti Vedanta Hospital, Penkar Pada Rd, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2760, lng:72.8700,
    phone:'8655777733', web:'https://bit.ly/lush-turf-booking',
    sports:['Football','Pickleball'], price:500, range:'₹500–₹1500',
  },
  {
    id:'48', area:'Mira-Bhayandar',
    name:'Sportz Nation',
    address:'Mari Gold Rd, Unique Garden, Mira Road East',
    city:'Mira Road', pin:'401107', lat:19.2795, lng:72.8715,
    phone:'9920111161', web:'https://bit.ly/sportznation-booking',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1400',
  },
  {
    id:'49', area:'Mira-Bhayandar',
    name:'Trickshot Arena',
    address:'Bhayandar Flyover, Chandan Shanti, Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3020, lng:72.8520,
    phone:'9819999222', web:'https://bit.ly/trickshot-playo',
    sports:['Football','Cricket'], price:800, range:'₹800–₹1600',
  },
  {
    id:'50', area:'Mira-Bhayandar',
    name:'Spin Arena Turf',
    address:'Plot 243, Near RBK Global School, Indralok Ph 6, Bhayandar (E)',
    city:'Bhayandar', pin:'401105', lat:19.3030, lng:72.8530,
    phone:'9821111555', web:'',
    sports:['Cricket','Football'], price:900, range:'₹900–₹1500',
  },
  {
    id:'51', area:'Mira-Bhayandar',
    name:'Majestic Turf',
    address:'Kanakia Road, Near Star Market, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2825, lng:72.8725,
    phone:'9867000000', web:'https://bit.ly/majestic-turf-booking',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1500',
  },
  {
    id:'52', area:'Mira-Bhayandar',
    name:'Pitchnova Arena',
    address:'Shree Maheshwari Bhavan Road, Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3005, lng:72.8505,
    phone:'9833535181', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1500',
  },
  {
    id:'53', area:'Mira-Bhayandar',
    name:'The Bishop Sports',
    address:'The Bishop International School, Geeta Nagar, Bhayandar (W)',
    city:'Bhayandar', pin:'401101', lat:19.3015, lng:72.8515,
    phone:'9819000000', web:'',
    sports:['Multi-sport'], price:600, range:'₹600–₹1300',
  },
  {
    id:'54', area:'Mira-Bhayandar',
    name:'AJ Turf House',
    address:'Kanakia Rd, Near SVP Vidyalaya, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2830, lng:72.8730,
    phone:'9265203709', web:'',
    sports:['Cricket'], price:700, range:'₹700–₹1500',
  },
  {
    id:'55', area:'Mira-Bhayandar',
    name:'P G Vora Turf',
    address:'Shanti Vihar, Mira Bhayandar Rd, Mira Road East',
    city:'Mira Road', pin:'401107', lat:19.2770, lng:72.8695,
    phone:'9930000000', web:'',
    sports:['Football'], price:600, range:'₹600–₹1200',
  },
  {
    id:'56', area:'Mira-Bhayandar',
    name:'Hi Score Turf',
    address:'Opp Fire Brigade, Maheshwari Bhavan Rd, Bhayandar (W)',
    city:'Bhayandar', pin:'401101', lat:19.3025, lng:72.8525,
    phone:'9867111111', web:'',
    sports:['Cricket'], price:800, range:'₹800–₹1400',
  },
  {
    id:'57', area:'Mira-Bhayandar',
    name:'Blue Pitch Turf',
    address:'Near Planetaria Complex, Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3035, lng:72.8535,
    phone:'9029111111', web:'',
    sports:['Football','Cricket'], price:1000, range:'₹1000–₹1600',
  },
  {
    id:'58', area:'Mira-Bhayandar',
    name:'MH04 Turf',
    address:'Behind Shubham Hotel, Mira Road (E)',
    city:'Mira Road', pin:'401107', lat:19.2835, lng:72.8735,
    phone:'9833000000', web:'',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1500',
  },
  {
    id:'59', area:'Mira-Bhayandar',
    name:'Ozone Turf Mira Road',
    address:'Pleasant Park, Mira Road East',
    city:'Mira Road', pin:'401107', lat:19.2755, lng:72.8690,
    phone:'9821000000', web:'',
    sports:['Cricket','Football'], price:700, range:'₹700–₹1400',
  },
  {
    id:'60', area:'Mira-Bhayandar',
    name:'Dugout Turf',
    address:'Shanti Nagar, Mira Road East',
    city:'Mira Road', pin:'401107', lat:19.2765, lng:72.8692,
    phone:'9324000000', web:'',
    sports:['Football','Cricket'], price:700, range:'₹700–₹1500',
  },
  {
    id:'61', area:'Mira-Bhayandar',
    name:'Kasturi Garden',
    address:'Padmavati Nagar, Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3040, lng:72.8540,
    phone:'9833535181', web:'',
    sports:['Multi-sport'], price:700, range:'₹700–₹1500',
  },
  {
    id:'62', area:'Mira-Bhayandar',
    name:'Gi Sports Arena',
    address:'Beverly Park, Mira Road East',
    city:'Mira Road', pin:'401107', lat:19.2782, lng:72.8712,
    phone:'9029000000', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800–₹1500',
  },
  {
    id:'63', area:'Mira-Bhayandar',
    name:'Strikers Arena Mira Road',
    address:'Beverly Park, Mira Road East',
    city:'Mira Road', pin:'401107', lat:19.2784, lng:72.8714,
    phone:'9820000000', web:'',
    sports:['Football','Cricket'], price:600, range:'₹600–₹1400',
  },
  {
    id:'64', area:'Mira-Bhayandar',
    name:'Headquarters Turf',
    address:'Mira-Bhayandar',
    city:'Mira Road', pin:'401107', lat:19.2800, lng:72.8700,
    phone:'7400382839', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },
  {
    id:'65', area:'Mira-Bhayandar',
    name:'JP Turf',
    address:'Mira-Bhayandar',
    city:'Mira Road', pin:'401107', lat:19.2802, lng:72.8702,
    phone:'8369657604', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },
  {
    id:'66', area:'Mira-Bhayandar',
    name:'Ozone Turf Bhayandar',
    address:'Bhayandar',
    city:'Bhayandar', pin:'401101', lat:19.3002, lng:72.8502,
    phone:'8591022503', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },
  {
    id:'67', area:'Mira-Bhayandar',
    name:'Trick Shot Turf',
    address:'Bhayandar West',
    city:'Bhayandar', pin:'401101', lat:19.3022, lng:72.8522,
    phone:'9930358081', web:'',
    sports:['Football','Cricket'], price:800, range:'N/A',
  },
  {
    id:'68', area:'Mira-Bhayandar',
    name:'Gaffar Turf',
    address:'Mira-Bhayandar',
    city:'Mira Road', pin:'401107', lat:19.2804, lng:72.8704,
    phone:'9136898087', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },
  {
    id:'69', area:'Mira-Bhayandar',
    name:'R7 Turf',
    address:'Mira-Bhayandar',
    city:'Mira Road', pin:'401107', lat:19.2806, lng:72.8706,
    phone:'9594937448', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },

  // ══════════════════════════════════════════════════════════
  // DAHISAR – KANDIVALI  (33 turfs, IDs 70-102)
  // ══════════════════════════════════════════════════════════
  {
    id:'70', area:'Dahisar-Kandivali',
    name:'Nine Stars Turfs X SportVot',
    address:'Bhoir Garden, Ghartanpada no 1, Suhasini Pawaskar Marg Road, Vaishali Nagar, Dahisar East',
    city:'Dahisar', pin:'400068', lat:19.2500, lng:72.8600,
    phone:'9987173316', web:'http://ninestarssports.com/',
    sports:['Cricket','Football'], price:1200, range:'₹1200–₹1600',
    disc:10, discNote:'Member Discount Available',
  },
  {
    id:'71', area:'Dahisar-Kandivali',
    name:'Turf Arena Dahisar',
    address:'Kandarpada, Dahisar West, Mumbai 400068',
    city:'Dahisar', pin:'400068', lat:19.2480, lng:72.8570,
    phone:'9167968333', web:'',
    sports:['Cricket','Football'], price:600, range:'N/A',
  },
  {
    id:'72', area:'Dahisar-Kandivali',
    name:'LP Sports Arena Turf',
    address:'Near LP Shingte Film Studio, Dahisar East, Mumbai 400068',
    city:'Dahisar', pin:'400068', lat:19.2510, lng:72.8610,
    phone:'', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'73', area:'Dahisar-Kandivali',
    name:'Jaya Nagar Sports Academy',
    address:'Jayanagar Sports Academy, New Link Rd, near Jain Mandir, Dahisar East, Mumbai 400068',
    city:'Dahisar', pin:'400068', lat:19.2515, lng:72.8615,
    phone:'8355880015', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'74', area:'Dahisar-Kandivali',
    name:'Force Playing Fields Dahisar',
    address:'Suhasini Pawaskar Rd, Vaishali Nagar, Dahisar East, Mumbai 400068',
    city:'Dahisar', pin:'400068', lat:19.2505, lng:72.8605,
    phone:'8097098366', web:'',
    sports:['Cricket','Football'], price:400, range:'₹400',
  },
  {
    id:'75', area:'Dahisar-Kandivali',
    name:'LP Shingte Turf',
    address:'Lp. Shingte Ground, Konkani Pada, Dahisar East, Mumbai 400068',
    city:'Dahisar', pin:'400068', lat:19.2512, lng:72.8612,
    phone:'9869657247', web:'',
    sports:['Cricket','Football'], price:300, range:'₹300',
    disc:10, discNote:'Most affordable turf in Dahisar!',
  },
  {
    id:'76', area:'Dahisar-Kandivali',
    name:'Chogle Cricket Football Turf',
    address:'Shri Krishna Nagar, Borivali East, Mumbai 400066',
    city:'Borivali', pin:'400066', lat:19.2320, lng:72.8460,
    phone:'7947128292', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'77', area:'Dahisar-Kandivali',
    name:'JS Turf Cricket And Football Ground',
    address:'New Link Rd, behind Om Lalita Petrol Pump, Eksar Village, I C Colony, Borivali West 400103',
    city:'Borivali', pin:'400103', lat:19.2310, lng:72.8440,
    phone:'9619286327', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'78', area:'Dahisar-Kandivali',
    name:'Hi5ers Turf Borivali',
    address:'Garden Estate, near Khatau Mill Compound, Siddharth Nagar, Borivali East 400066',
    city:'Borivali', pin:'400066', lat:19.2330, lng:72.8470,
    phone:'9372398375', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'79', area:'Dahisar-Kandivali',
    name:'FootCric Nalanda Turf',
    address:'Nalanda Academy, RSC Rd Number 34, near Mangal Murti Hospital Road, Gorai 2, Borivali West 400091',
    city:'Borivali', pin:'400091', lat:19.2290, lng:72.8350,
    phone:'7942691927', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'80', area:'Dahisar-Kandivali',
    name:'Strikers Arena Turf Borivali',
    address:'Dadarkar Ground, Opp Shimpoli Pumping Station, New Link Rd, Chikoowadi, Borivali West 400092',
    city:'Borivali', pin:'400092', lat:19.2300, lng:72.8430,
    phone:'9967753555', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'81', area:'Dahisar-Kandivali',
    name:'The Playtime Turf',
    address:'Bombay Talkies Compound, D.N. Dubey Road, opp. St. Xavier\'s High School, Borivali East 400068',
    city:'Borivali', pin:'400068', lat:19.2340, lng:72.8480,
    phone:'9587384384', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'82', area:'Dahisar-Kandivali',
    name:'TSG Sports Arena',
    address:'462, off Gorai Rd, New MHB Colony, Ashtavinayak Nagar, Borivali 400091',
    city:'Borivali', pin:'400091', lat:19.2285, lng:72.8345,
    phone:'9167925677', web:'http://www.thesportsgurukul.com/',
    sports:['Cricket','Football'], price:350, range:'₹350',
  },
  {
    id:'83', area:'Dahisar-Kandivali',
    name:'KaVeerNi Sports Arena',
    address:'Eskay Rd, Khutar Pada, Eksar Village, Eksar, Borivali West 400091',
    city:'Borivali', pin:'400091', lat:19.2305, lng:72.8435,
    phone:'7947419438', web:'',
    sports:['Cricket','Football'], price:500, range:'₹500',
  },
  {
    id:'84', area:'Dahisar-Kandivali',
    name:'Green Field Arena Turf',
    address:'Greenfield Arena, Kutchi Sarvoday Trust Ground, Eksar Village, Borivali 400091',
    city:'Borivali', pin:'400091', lat:19.2308, lng:72.8438,
    phone:'8591188331', web:'',
    sports:['Cricket','Football'], price:650, range:'₹650',
  },
  {
    id:'85', area:'Dahisar-Kandivali',
    name:'United Sports Field',
    address:'12, New Link Rd, opposite Starbucks, Eksar Village, Eksar, Borivali West 400103',
    city:'Borivali', pin:'400103', lat:19.2312, lng:72.8442,
    phone:'7045235258', web:'',
    sports:['Cricket','Football'], price:600, range:'₹600',
  },
  {
    id:'86', area:'Dahisar-Kandivali',
    name:'Goalster Sports Arena',
    address:'4th Floor, C1 Building, Goregaon Sports Club, New Link Rd, Malad West 400064',
    city:'Malad', pin:'400064', lat:19.1800, lng:72.8480,
    phone:'7021839064', web:'https://www.goalster.in/',
    sports:['Cricket','Football'], price:1000, range:'₹1000–₹2000',
    disc:20, discNote:'Early Bird Morning Slot Discount',
  },
  {
    id:'87', area:'Dahisar-Kandivali',
    name:'Urban Sports Zone Borivali',
    address:'Chogle High School, Rd Number 4, Sri Krishna Nagar, Borivali East 400066',
    city:'Borivali', pin:'400066', lat:19.2325, lng:72.8465,
    phone:'7942681041', web:'',
    sports:['Cricket','Football'], price:800, range:'₹800',
  },
  {
    id:'88', area:'Dahisar-Kandivali',
    name:'Hattrick Sports Field',
    address:'Eskay Rd, Eksar Village, Eksar, Borivali West 400091',
    city:'Borivali', pin:'400091', lat:19.2307, lng:72.8437,
    phone:'9920044638', web:'',
    sports:['Cricket','Football'], price:500, range:'₹500',
  },
  {
    id:'89', area:'Dahisar-Kandivali',
    name:'Force Playing Fields Gorai',
    address:'Adinath Marg, near Gokhale College, MHB Colony, Gorai 3, Borivali West 400091',
    city:'Borivali', pin:'400091', lat:19.2280, lng:72.8340,
    phone:'7947106925', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'90', area:'Dahisar-Kandivali',
    name:'TSG Sports Arena 2',
    address:'462, off Gorai Rd, New MHB Colony, Ashtavinayak Nagar, Borivali 400091',
    city:'Borivali', pin:'400091', lat:19.2286, lng:72.8346,
    phone:'9321986812', web:'http://www.thesportsgurukul.com/',
    sports:['Cricket','Football'], price:350, range:'₹350',
  },
  {
    id:'91', area:'Dahisar-Kandivali',
    name:'LP Sports Arena Turf 2',
    address:'Near LP Shingte Film Studio, Dahisar East, Mumbai 400068',
    city:'Dahisar', pin:'400068', lat:19.2511, lng:72.8611,
    phone:'7942696420', web:'',
    sports:['Cricket','Football'], price:350, range:'₹350',
  },
  {
    id:'92', area:'Dahisar-Kandivali',
    name:'Home Turf Thakur Stadium',
    address:'Thakur Stadium, Thakur Village, Kandivali East 400101',
    city:'Kandivali', pin:'400101', lat:19.2050, lng:72.8570,
    phone:'7947122191', web:'',
    sports:['Cricket','Football'], price:1500, range:'₹1500',
  },
  {
    id:'93', area:'Dahisar-Kandivali',
    name:'Home Turf Gaurav Shikar',
    address:'Thakur Village Rd, beside Gaurav Shikar CHS Ltd, Huzefa Nagar, Kandivali East 400101',
    city:'Kandivali', pin:'400101', lat:19.2055, lng:72.8575,
    phone:'7947133145', web:'',
    sports:['Cricket','Football'], price:2000, range:'₹2000',
  },
  {
    id:'94', area:'Dahisar-Kandivali',
    name:'FC Turf Café 109',
    address:'Plot No 109, Govt. Ind Estate, opp. Anmol Toys, Hindustan Naka, Charkop, Kandivali West 400067',
    city:'Kandivali', pin:'400067', lat:19.2010, lng:72.8290,
    phone:'7947422465', web:'',
    sports:['Cricket','Football'], price:1400, range:'₹1400',
  },
  {
    id:'95', area:'Dahisar-Kandivali',
    name:'Vishal\'s Magic Sports Arena',
    address:'5th Floor, Raghuleela Mega Mall, Poisar, Kandivali West 400067',
    city:'Kandivali', pin:'400067', lat:19.2040, lng:72.8310,
    phone:'9867476524', web:'https://hudle.in/venues/vishals-magic-sports-arena/300695',
    sports:['Cricket'], price:1000, range:'₹1000',
    disc:15, discNote:'Mall Booking Special Offer',
  },
  {
    id:'96', area:'Dahisar-Kandivali',
    name:'Urban Sports Kandivali',
    address:'Swami Vivekanand International School, Parekh Nagar, Kandivali West 400067',
    city:'Kandivali', pin:'400067', lat:19.2020, lng:72.8300,
    phone:'9969941234', web:'https://urbansports.in/',
    sports:['Cricket','Football'], price:700, range:'₹700',
  },
  {
    id:'97', area:'Dahisar-Kandivali',
    name:'Urban Sports Zone Thakur Kandivali',
    address:'Mahatma Gandhi Rd, New Saibaba Nagar, Hemu Colony, Kandivali West 400067',
    city:'Kandivali', pin:'400067', lat:19.2025, lng:72.8305,
    phone:'', web:'',
    sports:['Cricket','Football'], price:500, range:'₹500',
  },
  {
    id:'98', area:'Dahisar-Kandivali',
    name:'Thakur Shyamnarayan Turf',
    address:'Evershine Millennium Paradise, Thakur Village, Kandivali East 400101',
    city:'Kandivali', pin:'400101', lat:19.2060, lng:72.8580,
    phone:'7947418736', web:'',
    sports:['Cricket','Football'], price:0, range:'N/A',
  },
  {
    id:'99', area:'Dahisar-Kandivali',
    name:'FootCric Nalanda Turf Borivali',
    address:'Nalanda Academy, RSC Rd Number 34, Gorai 2, Borivali West 400091',
    city:'Borivali', pin:'400091', lat:19.2291, lng:72.8351,
    phone:'7947108959', web:'',
    sports:['Cricket','Football'], price:1500, range:'₹1500',
  },
  {
    id:'100', area:'Dahisar-Kandivali',
    name:'Turf Zone Malwani',
    address:'Malwani Church, Bhandarwada Rd, behind Mahavir Medical, Malad West 400095',
    city:'Malad', pin:'400095', lat:19.1860, lng:72.8390,
    phone:'8779754646', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },
  {
    id:'101', area:'Dahisar-Kandivali',
    name:'Kandivali Turf Zone',
    address:'Lokhandwala Foundation School, Akurli Rd, Anita Nagar, Kandivali East 400101',
    city:'Kandivali', pin:'400101', lat:19.2065, lng:72.8585,
    phone:'7947145535', web:'',
    sports:['Cricket','Football'], price:700, range:'N/A',
  },
  {
    id:'102', area:'Dahisar-Kandivali',
    name:'Force Playing Fields Vaishali',
    address:'Suhasini Pawaskar Rd, Vaishali Nagar, Dahisar East 400068',
    city:'Dahisar', pin:'400068', lat:19.2506, lng:72.8606,
    phone:'', web:'',
    sports:['Cricket','Football'], price:1200, range:'₹1200',
  },
];

function buildDoc(t, index) {
  return {
    name:         t.name,
    about:        `${t.sports.join(' and ')} turf at ${t.address}.`,
    images:       imgs(index),
    pricePerHour: t.price,
    priceRange:   t.range || 'N/A',
    status:       'available',
    address:  t.address,
    city:     t.city,
    state:    'Maharashtra',
    pincode:  t.pin,
    geoPoint: new GeoPoint(t.lat, t.lng),
    sports:       t.sports,
    groundSize:   '7-a-side',
    totalGrounds: 1,
    amenities: [
      "Parking",
      "Floodlights",
      "Changing Room",
      "Washrooms",
      "Drinking Water",
      "First Aid Kit",
      "Seating Area"
    ],
    openTime:  '06:00',
    closeTime: '23:00',
    weeklyOff: null,
    ownerId:   `owner_${t.id}`,
    ownerName: `${t.name} Management`,
    ownerPhone: t.phone || '',
    website:   t.web  || '',
    area:      t.area,
    rating:              parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
    totalReviews:        Math.floor(15 + Math.random() * 200),
    totalBookings:       Math.floor(80 + Math.random() * 1400),
    bookingsLast30Days:  Math.floor(8  + Math.random() * 100),
    isUnderMaintenance: false,
    maintenanceNote:    '',
    isDiscountActive:    t.disc     ? true  : false,
    discountPercent:     t.disc     || 0,
    discountDescription: t.discNote || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function seedAllTurfs() {
  console.log('🌱 Starting seed…');
  console.log(`📦 Total turfs: ${TURFS.length}`);
  console.log('');
  let ok = 0, fail = 0;
  for (let i = 0; i < TURFS.length; i++) {
    const t = TURFS[i];
    try {
      await setDoc(doc(db, 'turf', t.id), buildDoc(t, i), { merge: true });
      console.log(`✅ [${t.id.padStart(3)}] ${t.name}`);
      ok++;
    } catch (err) {
      console.error(`❌ [${t.id}] ${t.name} →`, err.message);
      fail++;
    }
  }
  console.log('');
  console.log('══════════════════════════════════════');
  console.log(`🎉  Seed complete!`);
  console.log(`    ✅  Success : ${ok}`);
  console.log(`    ❌  Failed  : ${fail}`);
  console.log(`    📦  Total   : ${TURFS.length}`);
  console.log('══════════════════════════════════════');
  return { ok, fail, total: TURFS.length };
}

export async function seedByArea(area) {
  const list = TURFS.filter(t => t.area === area);
  console.log(`🌱 Seeding ${list.length} turfs for: ${area}`);
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    await setDoc(doc(db, 'turf', t.id), buildDoc(t, i), { merge: true });
    console.log(`  ✅ [${t.id}] ${t.name}`);
  }
  console.log(`\n✅  ${list.length} turfs seeded for "${area}".`);
}
