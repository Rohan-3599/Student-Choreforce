export interface GroceryItem {
  id: string;
  name: string;
  price: number;
  store: "trader_joes" | "target";
  category: "produce" | "snacks" | "frozen" | "dairy" | "beverages" | "pantry" | "bakery" | "meat";
}

export const GROCERY_CATALOG: GroceryItem[] = [
  { id: "tj-1", name: "Bananas (bunch)", price: 0.19, store: "trader_joes", category: "produce" },
  { id: "tj-2", name: "Teeny Tiny Avocados (bag of 6)", price: 3.49, store: "trader_joes", category: "produce" },
  { id: "tj-3", name: "Organic Baby Spinach (6oz)", price: 2.49, store: "trader_joes", category: "produce" },
  { id: "tj-4", name: "Chili & Lime Rolled Tortilla Chips", price: 2.99, store: "trader_joes", category: "snacks" },
  { id: "tj-5", name: "Peanut Butter Filled Pretzel Nuggets", price: 2.69, store: "trader_joes", category: "snacks" },
  { id: "tj-6", name: "Organic Free Range Eggs (dozen)", price: 4.49, store: "trader_joes", category: "dairy" },
  { id: "tj-7", name: "Whole Milk (half gallon)", price: 3.29, store: "trader_joes", category: "dairy" },
  { id: "tj-8", name: "Cauliflower Gnocchi", price: 3.49, store: "trader_joes", category: "frozen" },
  { id: "tj-9", name: "Butter Chicken with Basmati Rice", price: 4.49, store: "trader_joes", category: "frozen" },
  { id: "tj-10", name: "Mandarin Orange Chicken", price: 5.49, store: "trader_joes", category: "frozen" },
  { id: "tj-11", name: "Sublime Ice Cream Sandwiches (4pk)", price: 4.99, store: "trader_joes", category: "frozen" },
  { id: "tj-12", name: "Sourdough Bread Loaf", price: 3.99, store: "trader_joes", category: "bakery" },
  { id: "tj-13", name: "Everything But The Bagel Seasoning", price: 2.49, store: "trader_joes", category: "pantry" },
  { id: "tj-14", name: "Organic Pasta (penne)", price: 1.29, store: "trader_joes", category: "pantry" },
  { id: "tj-15", name: "Chicken Breast (per lb)", price: 6.99, store: "trader_joes", category: "meat" },
  { id: "tj-16", name: "Cold Brew Coffee Concentrate", price: 7.99, store: "trader_joes", category: "beverages" },
  { id: "tj-17", name: "Sparkling Water (12pk)", price: 4.49, store: "trader_joes", category: "beverages" },
  { id: "tj-18", name: "Greek Yogurt (plain, 16oz)", price: 3.99, store: "trader_joes", category: "dairy" },
  { id: "tg-1", name: "Good & Gather Whole Milk (gallon)", price: 4.29, store: "target", category: "dairy" },
  { id: "tg-2", name: "Good & Gather Large Eggs (dozen)", price: 4.99, store: "target", category: "dairy" },
  { id: "tg-3", name: "Strawberries (1lb)", price: 3.99, store: "target", category: "produce" },
  { id: "tg-4", name: "Organic Bananas (bunch)", price: 0.29, store: "target", category: "produce" },
  { id: "tg-5", name: "Baby Carrots (1lb bag)", price: 1.79, store: "target", category: "produce" },
  { id: "tg-6", name: "Good & Gather Chicken Breast (per lb)", price: 7.49, store: "target", category: "meat" },
  { id: "tg-7", name: "Good & Gather Sliced Turkey Deli Meat", price: 4.99, store: "target", category: "meat" },
  { id: "tg-8", name: "Favorite Day Chocolate Chip Cookies", price: 3.49, store: "target", category: "snacks" },
  { id: "tg-9", name: "Good & Gather Tortilla Chips", price: 2.99, store: "target", category: "snacks" },
  { id: "tg-10", name: "Good & Gather Pasta Sauce (marinara)", price: 2.69, store: "target", category: "pantry" },
  { id: "tg-11", name: "Good & Gather Penne Pasta", price: 1.29, store: "target", category: "pantry" },
  { id: "tg-12", name: "Good & Gather Peanut Butter (16oz)", price: 3.49, store: "target", category: "pantry" },
  { id: "tg-13", name: "Wonder Bread White (20oz)", price: 3.29, store: "target", category: "bakery" },
  { id: "tg-14", name: "DiGiorno Rising Crust Pizza", price: 7.99, store: "target", category: "frozen" },
  { id: "tg-15", name: "Ben & Jerry's Ice Cream (pint)", price: 5.99, store: "target", category: "frozen" },
  { id: "tg-16", name: "Good & Gather Frozen Broccoli (12oz)", price: 1.49, store: "target", category: "frozen" },
  { id: "tg-17", name: "Smartwater (6pk bottles)", price: 7.49, store: "target", category: "beverages" },
  { id: "tg-18", name: "Coca-Cola (12pk cans)", price: 7.99, store: "target", category: "beverages" },
];

export const STORE_LABELS: Record<string, string> = {
  trader_joes: "Trader Joe's",
  target: "Target",
};

export const GROCERY_CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  snacks: "Snacks",
  frozen: "Frozen",
  dairy: "Dairy & Eggs",
  beverages: "Beverages",
  pantry: "Pantry",
  bakery: "Bakery",
  meat: "Meat & Deli",
};
