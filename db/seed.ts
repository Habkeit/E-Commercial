import { db } from './index';
import { users, customers, restaurants, dishes } from './schema';
import { uuidv7 } from 'uuidv7';
import bcrypt from 'bcrypt';


function createTimestampFromTime(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

async function main() {
  console.log("🔥 Seeding real data into the Database (UUIDv7 Mode)...");


  
  // UUIDs for Users
  const user1_id = uuidv7(); // Customer 1
  const user2_id = uuidv7(); // Customer 2
  const user3_id = uuidv7(); // Restaurant 1
  const user4_id = uuidv7(); // Restaurant 2
  const user5_id = uuidv7(); // Restaurant 3
  const user6_id = uuidv7(); // Restaurant 4

  // UUIDs for Restaurants
  const res1_id = uuidv7();
  const res2_id = uuidv7();
  const res3_id = uuidv7();
  const res4_id = uuidv7();

  
  const category_rice = uuidv7();
  const category_bread = uuidv7();
  const category_coffee = uuidv7();
  const category_fastfood = uuidv7();

  
  const saltRounds = 10;
  
  const hashedPw1 = await bcrypt.hash('261106', saltRounds);
  const hashedPw2 = await bcrypt.hash('263646', saltRounds);
  const hashedPw3 = await bcrypt.hash('ngonlamluon10', saltRounds);
  const hashedPw4 = await bcrypt.hash('NgonBoRe25k', saltRounds);
  const hashedPw5 = await bcrypt.hash('ThomNgon5sao', saltRounds);
  const hashedPw6 = await bcrypt.hash('34567', saltRounds);

  await db.insert(users).values([
    // Customers
    { id: user1_id, username: 'quachHa2611', password: hashedPw1, actState: 'offline' },
    { id: user2_id, username: 'QuangThang2108', password: hashedPw2, actState: 'offline' },
    // Restaurants
    { id: user3_id, username: 'ComTamBaoMap', password: hashedPw3, actState: 'offline' },
    { id: user4_id, username: 'BanhmiPewpew', password: hashedPw4, actState: 'offline' },
    { id: user5_id, username: 'HighlandsCf01', password: hashedPw5, actState: 'offline' },
    { id: user6_id, username: 'KFCThuDuc', password: hashedPw6, actState: 'offline' }
  ]);


  await db.insert(customers).values([
    { id: uuidv7(), userId: user1_id, email: 'quachha365@gmail.com', phone: '0987616319' },
    { id: uuidv7(), userId: user2_id, email: 'QuangThang2108@gmail.com', phone: '0234534617' },
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


  await db.insert(dishes).values([
    // Restaurant: Bao Map Broken Rice
    { id: uuidv7(), restaurantId: res1_id, categoryId: category_rice, name: 'Pork Rib Broken Rice', price: '35000.00', description: 'Rice, pork rib, soup, pork rinds' },
    { id: uuidv7(), restaurantId: res1_id, categoryId: category_rice, name: 'Special Broken Rice', price: '60000.00', description: 'Pork rib, pork skin, egg, meatloaf, pork rinds' },
    
    // Restaurant: Pew Pew Banh Mi
    { id: uuidv7(), restaurantId: res2_id, categoryId: category_bread, name: 'Roast Pork Banh Mi', price: '35000.00', description: 'Heat before eating' },
    { id: uuidv7(), restaurantId: res2_id, categoryId: category_bread, name: 'Mixed Banh Mi', price: '40000.00', description: 'Full toppings' },
    
    // Restaurant: Highland Coffee
    { id: uuidv7(), restaurantId: res3_id, categoryId: category_coffee, name: 'Milk Coffee', price: '25000.00', description: 'Traditional filter coffee' },
    { id: uuidv7(), restaurantId: res3_id, categoryId: category_coffee, name: 'Egg Cream Coffee', price: '35000.00', description: 'Rich and creamy egg cream' },
    
    // Restaurant: KFC Thu Duc
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