/**
 * Firestore Database Seeding Script
 * 
 * Populates Firestore with sample data for development and testing.
 * Run this once to initialize your database with sample turfs and owners.
 */

import { seedSampleTurfs } from '../firebase/turfs';
import { createOwnerProfile } from '../firebase/owners';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Seed sample owner profiles
 */
const seedOwners = async () => {
  try {
    const sampleOwners = [
      {
        id: 'owner123',
        userId: 'user123', // This should match a real user ID after authentication
        businessName: 'Green Sports Management',
        businessEmail: 'rajesh@greensports.com',
        businessPhone: '+91 98765 43210',
        panNumber: 'ABCDE1234F',
        gstNumber: '27ABCDE1234F1Z5',
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'HDFC0001234',
          accountHolderName: 'Rajesh Kumar',
          bankName: 'HDFC Bank',
        },
        status: 'approved',
        turfIds: ['green-arena-andheri', 'sports-hub-bandra'],
        totalEarnings: 0,
        pendingPayouts: 0,
        approvedAt: serverTimestamp(),
        lastPayoutDate: null,
      },
      {
        id: 'owner456',
        userId: 'user456',
        businessName: 'PlayZone Sports',
        businessEmail: 'amit@playzone.com',
        businessPhone: '+91 98765 12345',
        panNumber: 'FGHIJ5678K',
        gstNumber: '27FGHIJ5678K1Z5',
        bankDetails: {
          accountNumber: '9876543210',
          ifscCode: 'ICIC0001234',
          accountHolderName: 'Amit Sharma',
          bankName: 'ICICI Bank',
        },
        status: 'approved',
        turfIds: ['playzone-pune-baner'],
        totalEarnings: 0,
        pendingPayouts: 0,
        approvedAt: serverTimestamp(),
        lastPayoutDate: null,
      },
    ];

    for (const owner of sampleOwners) {
      const ownerRef = doc(db, 'owners', owner.id);
      await setDoc(ownerRef, {
        ...owner,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Seeded owner: ${owner.businessName}`);
    }

    return `✅ Successfully seeded ${sampleOwners.length} sample owners`;
  } catch (error) {
    console.error('❌ Error seeding owners:', error);
    throw new Error(`Failed to seed owners: ${error.message}`);
  }
};

/**
 * Seed sample user profiles
 */
const seedUsers = async () => {
  try {
    const sampleUsers = [
      {
        id: 'user123',
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        picture: 'https://ui-avatars.com/api/?name=Rajesh+Kumar',
        phone: '+91 98765 43210',
        role: 'owner',
        ownerId: 'owner123',
        preferredLocation: 'Mumbai',
        favoriteSport: 'Football',
        favorites: [],
      },
      {
        id: 'user456',
        name: 'Amit Sharma',
        email: 'amit@example.com',
        picture: 'https://ui-avatars.com/api/?name=Amit+Sharma',
        phone: '+91 98765 12345',
        role: 'owner',
        ownerId: 'owner456',
        preferredLocation: 'Pune',
        favoriteSport: 'Football',
        favorites: [],
      },
      {
        id: 'customer001',
        name: 'Priya Patel',
        email: 'priya@example.com',
        picture: 'https://ui-avatars.com/api/?name=Priya+Patel',
        phone: '+91 98765 99999',
        role: 'customer',
        ownerId: null,
        preferredLocation: 'Mumbai',
        favoriteSport: 'Football',
        favorites: ['green-arena-andheri'],
      },
    ];

    for (const user of sampleUsers) {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Seeded user: ${user.name}`);
    }

    return `✅ Successfully seeded ${sampleUsers.length} sample users`;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw new Error(`Failed to seed users: ${error.message}`);
  }
};

/**
 * Main seed function - runs all seeding operations
 */
export const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  console.log('');

  try {
    // Seed in order: users -> owners -> turfs
    console.log('📝 Seeding users...');
    const usersResult = await seedUsers();
    console.log(usersResult);
    console.log('');

    console.log('👔 Seeding owners...');
    const ownersResult = await seedOwners();
    console.log(ownersResult);
    console.log('');

    console.log('🏟️  Seeding turfs...');
    const turfsResult = await seedSampleTurfs();
    console.log(turfsResult);
    console.log('');

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  - 3 sample users created');
    console.log('  - 2 sample owners created');
    console.log('  - 3 sample turfs created');
    console.log('');
    console.log('🎉 You can now browse turfs and test the application!');

    return {
      success: true,
      message: 'Database seeded successfully',
    };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Export individual seed functions for flexibility
export { seedOwners, seedUsers };
