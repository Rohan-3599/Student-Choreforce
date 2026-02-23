import { db } from "./db";
import { tasks } from "@shared/schema";
import { users } from "@shared/models/auth";
import { sql } from "drizzle-orm";

export async function seedTasks() {
  try {
    const existingTasks = await db.select().from(tasks).limit(1);
    if (existingTasks.length > 0) return;

    const seedUsers = [
      {
        id: "seed-user-1",
        email: "tommy.trojan@usc.edu",
        firstName: "Tommy",
        lastName: "Trojan",
        profileImageUrl: null,
      },
      {
        id: "seed-user-2",
        email: "jenny.cardinal@usc.edu",
        firstName: "Jenny",
        lastName: "Cardinal",
        profileImageUrl: null,
      },
      {
        id: "seed-user-3",
        email: "marcus.gold@usc.edu",
        firstName: "Marcus",
        lastName: "Gold",
        profileImageUrl: null,
      },
    ];

    for (const user of seedUsers) {
      await db
        .insert(users)
        .values(user)
        .onConflictDoNothing();
    }

    const seedTasks = [
      {
        title: "Trader Joe's grocery run - need essentials",
        description: "Need someone to pick up milk, eggs, bread, bananas, chicken breast, and pasta from the Trader Joe's on Figueroa. I'll send a detailed list with photos. Please text me before checking out!",
        category: "grocery_shopping" as const,
        budget: 25,
        location: "Parkside Arts & Humanities, Room 312",
        posterId: "seed-user-1",
      },
      {
        title: "Deep clean my dorm room before parents visit",
        description: "Parents are visiting this weekend and my dorm is a disaster. Need vacuuming, dusting, bathroom cleaning, and general tidying up. Cleaning supplies are provided. Approx 45 mins of work.",
        category: "dorm_cleaning" as const,
        budget: 40,
        location: "McCarthy Hall, Suite 405",
        posterId: "seed-user-2",
      },
      {
        title: "3 loads of laundry - wash, dry, and fold",
        description: "I have 3 loads of laundry that need to be washed, dried, and folded. All regular clothes, no special care needed. I'll provide the detergent pods. Machines are in the basement.",
        category: "laundry" as const,
        budget: 20,
        location: "Webb Tower, Floor 6",
        posterId: "seed-user-3",
      },
      {
        title: "Costco run for party supplies",
        description: "Throwing a study group party. Need chips, soda, cups, napkins, and a veggie tray from Costco. I have a Costco membership card you can borrow. Will reimburse for all items plus pay the service fee.",
        category: "grocery_shopping" as const,
        budget: 35,
        location: "Troy Hall, Common Room",
        posterId: "seed-user-1",
      },
      {
        title: "Quick bathroom and kitchen clean",
        description: "Just need the shared bathroom and kitchenette area cleaned. Mopping, wiping counters, cleaning the sink and toilet. Should take about 30 minutes. All supplies under the kitchen sink.",
        category: "dorm_cleaning" as const,
        budget: 22,
        location: "Fluor Tower, Room 718",
        posterId: "seed-user-3",
      },
    ];

    await db.insert(tasks).values(seedTasks);
    console.log("Seeded 5 tasks successfully");
  } catch (error) {
    console.error("Error seeding tasks:", error);
  }
}
