// seed.ts
import { db } from './index';
import { users, restaurants, dishes } from './schema';
import { uuidv7 } from 'uuidv7';

function createTimestampFromTime(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

async function main() {
  console.log("🔥 Seeding real data into the Database (UUIDv7 Mode)...");

  // UUIDs for Users
  const user1_id = uuidv7(); 
  const user2_id = uuidv7();
  const user3_id = uuidv7();
  const user4_id = uuidv7();
  const user5_id = uuidv7();
  const user6_id = uuidv7();

  // UUIDs for Restaurants
  const res1_id = uuidv7();
  const res2_id = uuidv7();
  const res3_id = uuidv7();
  const res4_id = uuidv7();

  const category_rice = uuidv7();
  const category_bread = uuidv7();
  const category_coffee = uuidv7();
  const category_fastfood = uuidv7();

  
  await db.insert(users).values([
    { id: user1_id, clerkId: 'dummy_clerk_1', email: 'quachha365@gmail.com', fullName: 'Quach Ha' },
    { id: user2_id, clerkId: 'dummy_clerk_2', email: 'QuangThang2108@gmail.com', fullName: 'Quang Thang' },
    { id: user3_id, clerkId: 'dummy_clerk_3', email: 'comtambao@gmail.com', fullName: 'Com Tam Bao Map' },
    { id: user4_id, clerkId: 'dummy_clerk_4', email: 'banhmipew@gmail.com', fullName: 'Banhmi Pewpew' },
    { id: user5_id, clerkId: 'dummy_clerk_5', email: 'highlands@gmail.com', fullName: 'Highlands Cf' },
    { id: user6_id, clerkId: 'dummy_clerk_6', email: 'kfc@gmail.com', fullName: 'KFC Thu Duc' }
  ]);


  await db.insert(restaurants).values([
    {
      id: res1_id, userId: user3_id, name: 'Bao Map Broken Rice', 
      houseNumber: '68', street: 'D1', ward: 'Tang Nhon Phu', province: 'Ho Chi Minh', 
      note: 'Free iced tea', 
      openTime: createTimestampFromTime('10:00:00'), 
      closeTime: createTimestampFromTime('21:00:00') 
    },
    {
      id: res2_id, userId: user4_id, name: 'Pew Pew Banh Mi', 
      houseNumber: '84', street: 'D5', ward: 'Binh Thanh', province: 'Ho Chi Minh', 
      logo: 'banhmipewlogo.png', 
      openTime: createTimestampFromTime('07:00:00'), 
      closeTime: createTimestampFromTime('21:00:00') 
    },
    {
      id: res3_id, userId: user5_id, name: 'Highland Coffee', 
      houseNumber: '160', street: 'Le Van Viet', ward: 'Tang Nhon Phu', province: 'Ho Chi Minh', 
      logo: 'highland.logo.png', 
      openTime: createTimestampFromTime('07:00:00'), 
      closeTime: createTimestampFromTime('23:00:00') 
    },
    {
      id: res4_id, userId: user6_id, name: 'KFC Thu Duc', 
      houseNumber: '21', street: 'Vo Van Ngan', ward: 'Linh Chieu', province: 'Ho Chi Minh', 
      logo: 'KFClogo.png', note: 'Finger lickin good', 
      openTime: createTimestampFromTime('07:00:00'), 
      closeTime: createTimestampFromTime('23:00:00') 
    }
  ]);

  // 3. Thêm Dishes
  await db.insert(dishes).values([
    { id: uuidv7(), restaurantId: res1_id, categoryId: category_rice, name: 'Pork Rib Broken Rice', price: '35000.00', description: 'Rice, pork rib, soup, pork rinds' },
    { id: uuidv7(), restaurantId: res1_id, categoryId: category_rice, name: 'Special Broken Rice', price: '60000.00', description: 'Pork rib, pork skin, egg, meatloaf, pork rinds' },
    { id: uuidv7(), restaurantId: res2_id, categoryId: category_bread, name: 'Roast Pork Banh Mi', price: '35000.00', description: 'Heat before eating' },
    { id: uuidv7(), restaurantId: res2_id, categoryId: category_bread, name: 'Mixed Banh Mi', price: '40000.00', description: 'Full toppings' },
    { id: uuidv7(), restaurantId: res3_id, categoryId: category_coffee, name: 'Milk Coffee', price: '25000.00', description: 'Traditional filter coffee' },
    { id: uuidv7(), restaurantId: res3_id, categoryId: category_coffee, name: 'Egg Cream Coffee', price: '35000.00', description: 'Rich and creamy egg cream' },
    { id: uuidv7(), restaurantId: res4_id, categoryId: category_fastfood, name: 'Fried Chicken Drumstick', price: '25000.00' },
    { id: uuidv7(), restaurantId: res4_id, categoryId: category_fastfood, name: 'Special Combo', price: '60000.00', description: '3 drumsticks, french fries, pepsi' }
  ]);

  console.log("✅ Data seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error seeding data:", err);
  process.exit(1);
});