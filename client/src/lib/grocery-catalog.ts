export interface GroceryItem {
  id: string;
  name: string;
  price: number;
  store: "trader_joes" | "target";
  category: "produce" | "snacks" | "frozen" | "dairy" | "beverages" | "pantry" | "bakery" | "meat" | "prepared" | "household";
  emoji: string;
}

export const GROCERY_CATALOG: GroceryItem[] = [
  // TRADER JOE'S - Produce
  { id: "tj-p1", name: "Bananas (per lb)", price: 0.19, store: "trader_joes", category: "produce", emoji: "🍌" },
  { id: "tj-p2", name: "Teeny Tiny Avocados (bag of 6)", price: 3.49, store: "trader_joes", category: "produce", emoji: "🥑" },
  { id: "tj-p3", name: "Organic Baby Spinach (6oz)", price: 2.49, store: "trader_joes", category: "produce", emoji: "🥬" },
  { id: "tj-p4", name: "Organic Strawberries (1lb)", price: 4.49, store: "trader_joes", category: "produce", emoji: "🍓" },
  { id: "tj-p5", name: "Bag of Lemons (2lb)", price: 2.99, store: "trader_joes", category: "produce", emoji: "🍋" },
  { id: "tj-p6", name: "Sweet Potatoes (per lb)", price: 1.29, store: "trader_joes", category: "produce", emoji: "🍠" },
  { id: "tj-p7", name: "Organic Grape Tomatoes (pint)", price: 2.99, store: "trader_joes", category: "produce", emoji: "🍅" },
  { id: "tj-p8", name: "Green Onions (bunch)", price: 0.99, store: "trader_joes", category: "produce", emoji: "🧅" },

  // TRADER JOE'S - Dairy & Eggs
  { id: "tj-d1", name: "Organic Free Range Eggs (dozen)", price: 4.49, store: "trader_joes", category: "dairy", emoji: "🥚" },
  { id: "tj-d2", name: "Whole Milk (half gallon)", price: 3.29, store: "trader_joes", category: "dairy", emoji: "🥛" },
  { id: "tj-d3", name: "Greek Yogurt (plain, 16oz)", price: 3.99, store: "trader_joes", category: "dairy", emoji: "🫙" },
  { id: "tj-d4", name: "Shredded Mozzarella (8oz)", price: 2.99, store: "trader_joes", category: "dairy", emoji: "🧀" },
  { id: "tj-d5", name: "Cream Cheese (8oz)", price: 1.99, store: "trader_joes", category: "dairy", emoji: "🧈" },
  { id: "tj-d6", name: "Unsalted Butter (16oz)", price: 3.99, store: "trader_joes", category: "dairy", emoji: "🧈" },
  { id: "tj-d7", name: "Oat Milk (32oz)", price: 2.49, store: "trader_joes", category: "dairy", emoji: "🥛" },

  // TRADER JOE'S - Snacks
  { id: "tj-s1", name: "Chili & Lime Rolled Tortilla Chips", price: 2.99, store: "trader_joes", category: "snacks", emoji: "🌶️" },
  { id: "tj-s2", name: "Peanut Butter Filled Pretzel Nuggets", price: 2.69, store: "trader_joes", category: "snacks", emoji: "🥨" },
  { id: "tj-s3", name: "Dark Chocolate Peanut Butter Cups", price: 4.49, store: "trader_joes", category: "snacks", emoji: "🍫" },
  { id: "tj-s4", name: "Plantain Chips (6oz)", price: 1.99, store: "trader_joes", category: "snacks", emoji: "🍌" },
  { id: "tj-s5", name: "Trail Mix (16oz)", price: 5.99, store: "trader_joes", category: "snacks", emoji: "🥜" },
  { id: "tj-s6", name: "Mini Dark Chocolate Biscuit Cookies", price: 3.49, store: "trader_joes", category: "snacks", emoji: "🍪" },
  { id: "tj-s7", name: "Everything But The Bagel Seasoned Crackers", price: 3.49, store: "trader_joes", category: "snacks", emoji: "🥖" },

  // TRADER JOE'S - Frozen
  { id: "tj-f1", name: "Cauliflower Gnocchi", price: 3.49, store: "trader_joes", category: "frozen", emoji: "🥟" },
  { id: "tj-f2", name: "Butter Chicken with Basmati Rice", price: 4.49, store: "trader_joes", category: "frozen", emoji: "🍛" },
  { id: "tj-f3", name: "Mandarin Orange Chicken", price: 5.49, store: "trader_joes", category: "frozen", emoji: "🍊" },
  { id: "tj-f4", name: "Sublime Ice Cream Sandwiches (4pk)", price: 4.99, store: "trader_joes", category: "frozen", emoji: "🍦" },
  { id: "tj-f5", name: "Vegetable Fried Rice (16oz)", price: 2.99, store: "trader_joes", category: "frozen", emoji: "🍚" },
  { id: "tj-f6", name: "Mac and Cheese Bites (9oz)", price: 3.99, store: "trader_joes", category: "frozen", emoji: "🧀" },
  { id: "tj-f7", name: "Hashbrowns (10pk)", price: 2.49, store: "trader_joes", category: "frozen", emoji: "🥔" },
  { id: "tj-f8", name: "Pork Siu Mai Dumplings", price: 3.49, store: "trader_joes", category: "frozen", emoji: "🥟" },
  { id: "tj-f9", name: "Açaí Bowls (2pk)", price: 4.99, store: "trader_joes", category: "frozen", emoji: "🫐" },

  // TRADER JOE'S - Pantry
  { id: "tj-n1", name: "Everything But The Bagel Seasoning", price: 2.49, store: "trader_joes", category: "pantry", emoji: "🧂" },
  { id: "tj-n2", name: "Organic Pasta (penne, 16oz)", price: 1.29, store: "trader_joes", category: "pantry", emoji: "🍝" },
  { id: "tj-n3", name: "Organic Marinara Sauce (26oz)", price: 2.69, store: "trader_joes", category: "pantry", emoji: "🍅" },
  { id: "tj-n4", name: "Creamy Peanut Butter (16oz)", price: 2.49, store: "trader_joes", category: "pantry", emoji: "🥜" },
  { id: "tj-n5", name: "Jasmine Rice (3lb)", price: 3.99, store: "trader_joes", category: "pantry", emoji: "🍚" },
  { id: "tj-n6", name: "Organic Chicken Broth (32oz)", price: 2.49, store: "trader_joes", category: "pantry", emoji: "🍲" },
  { id: "tj-n7", name: "Organic Extra Virgin Olive Oil", price: 5.99, store: "trader_joes", category: "pantry", emoji: "🫒" },

  // TRADER JOE'S - Meat
  { id: "tj-m1", name: "Chicken Breast (per lb)", price: 6.99, store: "trader_joes", category: "meat", emoji: "🍗" },
  { id: "tj-m2", name: "Ground Turkey (1lb)", price: 5.49, store: "trader_joes", category: "meat", emoji: "🦃" },
  { id: "tj-m3", name: "Uncured Turkey Bacon", price: 3.99, store: "trader_joes", category: "meat", emoji: "🥓" },
  { id: "tj-m4", name: "Smoked Salmon (4oz)", price: 5.49, store: "trader_joes", category: "meat", emoji: "🐟" },

  // TRADER JOE'S - Bakery
  { id: "tj-b1", name: "Sourdough Bread Loaf", price: 3.99, store: "trader_joes", category: "bakery", emoji: "🍞" },
  { id: "tj-b2", name: "Croissants (4pk)", price: 4.49, store: "trader_joes", category: "bakery", emoji: "🥐" },
  { id: "tj-b3", name: "Everything Ciabatta Rolls (6pk)", price: 3.49, store: "trader_joes", category: "bakery", emoji: "🥖" },

  // TRADER JOE'S - Beverages
  { id: "tj-v1", name: "Cold Brew Coffee Concentrate", price: 7.99, store: "trader_joes", category: "beverages", emoji: "☕" },
  { id: "tj-v2", name: "Sparkling Water (12pk)", price: 4.49, store: "trader_joes", category: "beverages", emoji: "💧" },
  { id: "tj-v3", name: "Green Juice (15.2oz)", price: 3.99, store: "trader_joes", category: "beverages", emoji: "🥤" },
  { id: "tj-v4", name: "Triple Ginger Brew (4pk)", price: 4.49, store: "trader_joes", category: "beverages", emoji: "🍺" },

  // TRADER JOE'S - Prepared
  { id: "tj-r1", name: "Fresh Pesto (6oz)", price: 3.49, store: "trader_joes", category: "prepared", emoji: "🌿" },
  { id: "tj-r2", name: "Goat Cheese & Caramelized Onion Ravioli", price: 3.99, store: "trader_joes", category: "prepared", emoji: "🥟" },
  { id: "tj-r3", name: "Chicken Tikka Masala", price: 4.99, store: "trader_joes", category: "prepared", emoji: "🍛" },
  { id: "tj-r4", name: "Mediterranean Hummus (10oz)", price: 2.69, store: "trader_joes", category: "prepared", emoji: "🫘" },

  // TARGET - Produce
  { id: "tg-p1", name: "Organic Bananas (bunch)", price: 0.29, store: "target", category: "produce", emoji: "🍌" },
  { id: "tg-p2", name: "Strawberries (1lb)", price: 3.99, store: "target", category: "produce", emoji: "🍓" },
  { id: "tg-p3", name: "Baby Carrots (1lb bag)", price: 1.79, store: "target", category: "produce", emoji: "🥕" },
  { id: "tg-p4", name: "Avocados (each)", price: 1.29, store: "target", category: "produce", emoji: "🥑" },
  { id: "tg-p5", name: "Romaine Hearts (3pk)", price: 3.49, store: "target", category: "produce", emoji: "🥬" },
  { id: "tg-p6", name: "Blueberries (6oz)", price: 3.99, store: "target", category: "produce", emoji: "🫐" },
  { id: "tg-p7", name: "Yellow Onion (3lb bag)", price: 2.99, store: "target", category: "produce", emoji: "🧅" },
  { id: "tg-p8", name: "Russet Potatoes (5lb bag)", price: 4.49, store: "target", category: "produce", emoji: "🥔" },

  // TARGET - Dairy & Eggs
  { id: "tg-d1", name: "Good & Gather Whole Milk (gallon)", price: 4.29, store: "target", category: "dairy", emoji: "🥛" },
  { id: "tg-d2", name: "Good & Gather Large Eggs (dozen)", price: 4.99, store: "target", category: "dairy", emoji: "🥚" },
  { id: "tg-d3", name: "Chobani Greek Yogurt (32oz)", price: 5.79, store: "target", category: "dairy", emoji: "🫙" },
  { id: "tg-d4", name: "Good & Gather Shredded Cheddar (8oz)", price: 2.99, store: "target", category: "dairy", emoji: "🧀" },
  { id: "tg-d5", name: "Land O'Lakes Butter (16oz)", price: 4.99, store: "target", category: "dairy", emoji: "🧈" },
  { id: "tg-d6", name: "Silk Oat Milk (64oz)", price: 4.49, store: "target", category: "dairy", emoji: "🥛" },
  { id: "tg-d7", name: "Philadelphia Cream Cheese (8oz)", price: 3.49, store: "target", category: "dairy", emoji: "🧈" },

  // TARGET - Snacks
  { id: "tg-s1", name: "Favorite Day Chocolate Chip Cookies", price: 3.49, store: "target", category: "snacks", emoji: "🍪" },
  { id: "tg-s2", name: "Good & Gather Tortilla Chips (13oz)", price: 2.99, store: "target", category: "snacks", emoji: "🌮" },
  { id: "tg-s3", name: "Goldfish Crackers (30oz)", price: 8.99, store: "target", category: "snacks", emoji: "🐠" },
  { id: "tg-s4", name: "Lay's Classic Chips (8oz)", price: 4.29, store: "target", category: "snacks", emoji: "🥔" },
  { id: "tg-s5", name: "KIND Bars Variety Pack (12ct)", price: 14.99, store: "target", category: "snacks", emoji: "🥜" },
  { id: "tg-s6", name: "Oreo Cookies (13.29oz)", price: 4.99, store: "target", category: "snacks", emoji: "🍪" },
  { id: "tg-s7", name: "Skinny Pop Popcorn (4.4oz)", price: 3.99, store: "target", category: "snacks", emoji: "🍿" },

  // TARGET - Frozen
  { id: "tg-f1", name: "DiGiorno Rising Crust Pizza", price: 7.99, store: "target", category: "frozen", emoji: "🍕" },
  { id: "tg-f2", name: "Ben & Jerry's Ice Cream (pint)", price: 5.99, store: "target", category: "frozen", emoji: "🍦" },
  { id: "tg-f3", name: "Good & Gather Frozen Broccoli (12oz)", price: 1.49, store: "target", category: "frozen", emoji: "🥦" },
  { id: "tg-f4", name: "Trader Joe's-Style Frozen Burritos (8pk)", price: 9.99, store: "target", category: "frozen", emoji: "🌯" },
  { id: "tg-f5", name: "Eggo Waffles (10ct)", price: 3.79, store: "target", category: "frozen", emoji: "🧇" },
  { id: "tg-f6", name: "Hot Pockets (2pk)", price: 3.49, store: "target", category: "frozen", emoji: "🥟" },
  { id: "tg-f7", name: "Good & Gather Chicken Nuggets (29oz)", price: 7.99, store: "target", category: "frozen", emoji: "🍗" },
  { id: "tg-f8", name: "Talenti Gelato (pint)", price: 5.49, store: "target", category: "frozen", emoji: "🍨" },

  // TARGET - Pantry
  { id: "tg-n1", name: "Good & Gather Pasta Sauce (marinara)", price: 2.69, store: "target", category: "pantry", emoji: "🍅" },
  { id: "tg-n2", name: "Good & Gather Penne Pasta (16oz)", price: 1.29, store: "target", category: "pantry", emoji: "🍝" },
  { id: "tg-n3", name: "Good & Gather Peanut Butter (16oz)", price: 3.49, store: "target", category: "pantry", emoji: "🥜" },
  { id: "tg-n4", name: "Nature Valley Granola Bars (12ct)", price: 4.49, store: "target", category: "pantry", emoji: "🌾" },
  { id: "tg-n5", name: "Good & Gather Canned Tuna (5oz)", price: 1.29, store: "target", category: "pantry", emoji: "🐟" },
  { id: "tg-n6", name: "Kraft Mac & Cheese (7.25oz)", price: 1.39, store: "target", category: "pantry", emoji: "🧀" },
  { id: "tg-n7", name: "Good & Gather Olive Oil (16.9oz)", price: 5.99, store: "target", category: "pantry", emoji: "🫒" },
  { id: "tg-n8", name: "Campbell's Chicken Noodle Soup", price: 1.89, store: "target", category: "pantry", emoji: "🍲" },

  // TARGET - Meat
  { id: "tg-m1", name: "Good & Gather Chicken Breast (per lb)", price: 7.49, store: "target", category: "meat", emoji: "🍗" },
  { id: "tg-m2", name: "Good & Gather Sliced Turkey Deli Meat", price: 4.99, store: "target", category: "meat", emoji: "🦃" },
  { id: "tg-m3", name: "85% Lean Ground Beef (1lb)", price: 6.99, store: "target", category: "meat", emoji: "🥩" },
  { id: "tg-m4", name: "Oscar Mayer Turkey Bologna", price: 3.49, store: "target", category: "meat", emoji: "🥪" },
  { id: "tg-m5", name: "Good & Gather Bacon (12oz)", price: 5.99, store: "target", category: "meat", emoji: "🥓" },

  // TARGET - Bakery
  { id: "tg-b1", name: "Wonder Bread White (20oz)", price: 3.29, store: "target", category: "bakery", emoji: "🍞" },
  { id: "tg-b2", name: "Good & Gather Bagels (6ct)", price: 2.99, store: "target", category: "bakery", emoji: "🥯" },
  { id: "tg-b3", name: "Mission Flour Tortillas (10ct)", price: 3.49, store: "target", category: "bakery", emoji: "🫓" },
  { id: "tg-b4", name: "Favorite Day Blueberry Muffins (4ct)", price: 4.49, store: "target", category: "bakery", emoji: "🧁" },

  // TARGET - Beverages
  { id: "tg-v1", name: "Smartwater (6pk bottles)", price: 7.49, store: "target", category: "beverages", emoji: "💧" },
  { id: "tg-v2", name: "Coca-Cola (12pk cans)", price: 7.99, store: "target", category: "beverages", emoji: "🥤" },
  { id: "tg-v3", name: "Starbucks Cold Brew (48oz)", price: 8.99, store: "target", category: "beverages", emoji: "☕" },
  { id: "tg-v4", name: "Good & Gather Orange Juice (52oz)", price: 3.99, store: "target", category: "beverages", emoji: "🍊" },
  { id: "tg-v5", name: "Celsius Energy Drink (12pk)", price: 18.99, store: "target", category: "beverages", emoji: "⚡" },
  { id: "tg-v6", name: "LaCroix Sparkling Water (12pk)", price: 4.99, store: "target", category: "beverages", emoji: "💧" },

  // TARGET - Household
  { id: "tg-h1", name: "Tide Pods (42ct)", price: 13.99, store: "target", category: "household", emoji: "🧺" },
  { id: "tg-h2", name: "Bounty Paper Towels (6 rolls)", price: 13.49, store: "target", category: "household", emoji: "🧻" },
  { id: "tg-h3", name: "Clorox Disinfecting Wipes (75ct)", price: 4.99, store: "target", category: "household", emoji: "🧹" },
  { id: "tg-h4", name: "Glad Trash Bags (50ct)", price: 9.99, store: "target", category: "household", emoji: "🗑️" },
  { id: "tg-h5", name: "Dawn Dish Soap (16.2oz)", price: 3.99, store: "target", category: "household", emoji: "🫧" },

  // TRADER JOE'S - Household
  { id: "tj-h1", name: "Lavender Dryer Bags (set of 2)", price: 3.99, store: "trader_joes", category: "household", emoji: "💜" },
  { id: "tj-h2", name: "Multi-Surface Cleaner", price: 3.99, store: "trader_joes", category: "household", emoji: "🧹" },
];

export const STORE_LABELS: Record<string, string> = {
  trader_joes: "Trader Joe's",
  target: "Target",
};

export const STORE_INFO: Record<string, { name: string; tagline: string; color: string; bgColor: string; location: string }> = {
  trader_joes: {
    name: "Trader Joe's",
    tagline: "Your neighborhood grocery store",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    location: "USC Village, 929 W Jefferson Blvd",
  },
  target: {
    name: "Target",
    tagline: "Expect more. Pay less.",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    location: "USC Village, 3131 S Hoover St",
  },
};

export const GROCERY_CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  produce: { label: "Produce", emoji: "🥬" },
  dairy: { label: "Dairy & Eggs", emoji: "🥛" },
  meat: { label: "Meat & Deli", emoji: "🥩" },
  snacks: { label: "Snacks", emoji: "🍿" },
  frozen: { label: "Frozen", emoji: "🧊" },
  pantry: { label: "Pantry", emoji: "🥫" },
  bakery: { label: "Bakery", emoji: "🍞" },
  beverages: { label: "Beverages", emoji: "🥤" },
  prepared: { label: "Prepared Foods", emoji: "🍱" },
  household: { label: "Household", emoji: "🧹" },
};

export const GROCERY_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(GROCERY_CATEGORY_CONFIG).map(([key, val]) => [key, val.label])
);
