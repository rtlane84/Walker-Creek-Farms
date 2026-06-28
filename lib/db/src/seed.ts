import { db } from "./index";
import {
  rentalsTable,
  rentalPhotosTable,
  bookingsTable,
  blockedDatesTable,
  foodItemsTable,
  faqItemsTable,
  giftCertificatesTable,
  blogPostsTable,
  siteSettingsTable,
} from "./schema";

function addDays(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

async function seed() {
  console.log("Clearing existing demo data…");
  await db.delete(bookingsTable);
  await db.delete(blockedDatesTable);
  await db.delete(rentalPhotosTable);
  await db.delete(rentalsTable);
  await db.delete(foodItemsTable);
  await db.delete(faqItemsTable);
  await db.delete(giftCertificatesTable);
  await db.delete(blogPostsTable);
  await db.delete(siteSettingsTable);

  const cover = "/assets/hero-cabin.png";
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  console.log("Seeding rentals…");
  const [willowLake, mapleRidge, creekSide] = await db
    .insert(rentalsTable)
    .values([
      {
        name: "Willow Lake Cabin",
        type: "cabin",
        description:
          "A cozy lakeside retreat with panoramic views of Willow Lake. Perfect for couples or small families seeking peace and quiet among the West Virginia hills.",
        guestCount: 4,
        bedrooms: 2,
        bathrooms: 1,
        weekdayPrice: 189,
        weekendPrice: 229,
        cleaningFee: 75,
        taxRate: 6,
        amenities: "WiFi,Full Kitchen,Fireplace,Lake Access,Pet Friendly",
        coverPhoto: cover,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Maple Ridge Cabin",
        type: "cabin",
        description:
          "Nestled among maple trees with a wraparound porch and modern rustic finishes. Sleeps up to six with room to spread out after a day on the trails.",
        guestCount: 6,
        bedrooms: 3,
        bathrooms: 2,
        weekdayPrice: 219,
        weekendPrice: 269,
        cleaningFee: 85,
        taxRate: 6,
        amenities: "WiFi,Full Kitchen,Hot Tub,Trail Access,Pet Friendly",
        coverPhoto: cover,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Creek Side Cottage",
        type: "cottage",
        description:
          "Charming cottage steps from Walker Creek. Ideal for a romantic getaway or solo retreat with a screened porch and creek-side seating.",
        guestCount: 2,
        bedrooms: 1,
        bathrooms: 1,
        weekdayPrice: 159,
        weekendPrice: 189,
        cleaningFee: 65,
        taxRate: 6,
        amenities: "WiFi,Kitchenette,Fireplace,Creek Access",
        coverPhoto: cover,
        isActive: true,
        sortOrder: 3,
      },
    ])
    .returning();

  await db.insert(rentalPhotosTable).values([
    { rentalId: willowLake!.id, url: cover, caption: "Willow Lake view", sortOrder: 1 },
    { rentalId: mapleRidge!.id, url: cover, caption: "Maple Ridge porch", sortOrder: 1 },
    { rentalId: creekSide!.id, url: cover, caption: "Creek Side cottage", sortOrder: 1 },
  ]);

  console.log("Seeding FAQs…");
  await db.insert(faqItemsTable).values([
    {
      question: "Will I be able to access the internet?",
      answer: "Yes! Every rental boasts free Wifi.",
      sortOrder: 1,
    },
    {
      question: "Is there an additional fee for my dog(s)?",
      answer:
        "There is no additional fee. We love dogs! We will happily provide complimentary doggie beds and doggie treats for our furry guests upon request. The only thing we ask is that your puppies stay on leash while outdoors. We have some free roaming farm animals on site.",
      sortOrder: 2,
    },
    {
      question: "Do you provide fishing equipment?",
      answer:
        "We do not currently provide fishing equipment. If you want to fish in our fully stocked ponds, we encourage you to bring all necessary equipment.",
      sortOrder: 3,
    },
    {
      question: "Can I keep the fish I catch?",
      answer:
        "We are strictly catch and release. You can expect to catch a wide variety of fish in our ponds! Trout (seasonal), bass, hybrid blue gill, sunfish, catfish and more!",
      sortOrder: 4,
    },
    {
      question: "Can I order room service or buy food on the property?",
      answer:
        "At this time, we do not sell food at Walker Creek Farms & Cabins. However, we do have a partnership with Bop and Nana's Bakery and Catering located a few miles away. Place your order at least 1 day in advance and your food will be delivered to your door! We are also just 1 mile from Pizzas & Cream, a critically acclaimed restaurant offering brick oven pizzas, ice cream, gelato, and Italian ice (cash only).",
      sortOrder: 5,
    },
    {
      question: "What is there to do on the property?",
      answer:
        "Visit our small barn to meet goats, sheep, chickens, ducks, and donkeys. Enjoy seasonal paddle boats on Willow Lake, a playground for kids, over 6 miles of hiking and biking trails, fully stocked fishing ponds, horseshoe pits, and an axe throwing area.",
      sortOrder: 6,
    },
  ]);

  console.log("Seeding food items…");
  await db.insert(foodItemsTable).values([
    {
      category: "Breakfast Baskets",
      name: "Farm Fresh Breakfast Basket",
      description: "Local eggs, bacon, fresh bread, seasonal fruit, and coffee fixings delivered to your cabin.",
      price: 45,
      servingSize: "2 guests",
      isAvailable: true,
      sortOrder: 1,
    },
    {
      category: "Breakfast Baskets",
      name: "Continental Morning Box",
      description: "Pastries from Bop and Nana's, yogurt, granola, and orange juice.",
      price: 32,
      servingSize: "2 guests",
      isAvailable: true,
      sortOrder: 2,
    },
    {
      category: "Dinner Provisions",
      name: "Creek Side Charcuterie Board",
      description: "Artisan cheeses, cured meats, crackers, and local honey — perfect for a relaxed evening in.",
      price: 58,
      servingSize: "4 guests",
      isAvailable: true,
      sortOrder: 3,
    },
    {
      category: "Dinner Provisions",
      name: "Family Pasta Night Kit",
      description: "Fresh pasta, marinara, salad, and garlic bread from our catering partner. Heat and serve.",
      price: 72,
      servingSize: "4 guests",
      isAvailable: true,
      sortOrder: 4,
    },
    {
      category: "Snacks & Treats",
      name: "S'mores Campfire Kit",
      description: "Graham crackers, marshmallows, chocolate, and roasting sticks for your fire pit.",
      price: 18,
      servingSize: "4 guests",
      isAvailable: true,
      sortOrder: 5,
    },
    {
      category: "Snacks & Treats",
      name: "Local Snack Sampler",
      description: "West Virginia-made snacks, trail mix, and bottled water for your hikes.",
      price: 24,
      servingSize: "2 guests",
      isAvailable: true,
      sortOrder: 6,
    },
  ]);

  console.log("Seeding gift certificates…");
  await db.insert(giftCertificatesTable).values([
    {
      name: "Weekend Getaway",
      description: "A perfect gift for a two-night stay at any Walker Creek cabin.",
      amount: 100,
      isActive: true,
    },
    {
      name: "Family Retreat",
      description: "Give the gift of a memorable family escape in the West Virginia hills.",
      amount: 250,
      isActive: true,
    },
    {
      name: "Ultimate Creek Experience",
      description: "Our premium gift certificate for an extended stay or special occasion.",
      amount: 500,
      isActive: true,
    },
  ]);

  console.log("Seeding blog posts…");
  const publishedAt = new Date();
  publishedAt.setDate(publishedAt.getDate() - 14);
  await db.insert(blogPostsTable).values([
    {
      title: "Spring on the Farm",
      slug: "spring-on-the-farm",
      excerpt: "Baby goats, wildflowers, and the first paddle boats of the season on Willow Lake.",
      content:
        "<p>Spring arrives quietly at Walker Creek Farms. The barn fills with new life, trails reopen, and Willow Lake beckons for those first warm afternoons.</p><p>We love sharing the farm with guests who appreciate the slower pace of country living — morning coffee on the porch, afternoon hikes, and evenings by the fire.</p>",
      coverImage: cover,
      isPublished: true,
      publishedAt,
    },
    {
      title: "A Guide to Catch-and-Release Fishing",
      slug: "catch-and-release-fishing",
      excerpt: "Everything you need to know about our stocked ponds and responsible fishing.",
      content:
        "<p>Our ponds are stocked with trout (seasonal), bass, hybrid bluegill, sunfish, and catfish. We practice strictly catch and release to keep the ecosystem healthy for everyone.</p><p>Bring your own gear, find a quiet spot, and enjoy one of the most peaceful activities on the property.</p>",
      coverImage: cover,
      isPublished: true,
      publishedAt: new Date(publishedAt.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Meet the Farm Animals",
      slug: "meet-the-farm-animals",
      excerpt: "Goats, sheep, chickens, ducks, and donkeys — a favorite stop for families.",
      content:
        "<p>Our small barn is home to a friendly crew of farm animals. Kids and adults alike love stopping by to say hello during their stay.</p><p>Please keep dogs on leash near the barn area, and always supervise children around the animals.</p>",
      coverImage: cover,
      isPublished: true,
      publishedAt: new Date(publishedAt.getTime() - 21 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log("Seeding bookings…");
  await db.insert(bookingsTable).values([
    {
      rentalId: willowLake!.id,
      guestName: "Sarah Mitchell",
      guestEmail: "sarah.mitchell@example.com",
      guestPhone: "304-555-0101",
      checkIn: addDays(today, -30),
      checkOut: addDays(today, -27),
      guestCount: 2,
      status: "confirmed",
      nightlyTotal: 687,
      cleaningFee: 75,
      taxAmount: 45.72,
      totalPrice: 807.72,
      paymentMode: "full",
      stripePaymentIntentId: "demo_pi_past",
    },
    {
      rentalId: mapleRidge!.id,
      guestName: "James & Linda Carter",
      guestEmail: "carter.family@example.com",
      guestPhone: "304-555-0102",
      checkIn: addDays(today, 14),
      checkOut: addDays(today, 17),
      guestCount: 4,
      status: "confirmed",
      nightlyTotal: 807,
      cleaningFee: 85,
      taxAmount: 53.52,
      totalPrice: 945.52,
      paymentMode: "full",
      stripePaymentIntentId: "demo_pi_upcoming",
    },
    {
      rentalId: creekSide!.id,
      guestName: "Alex Rivera",
      guestEmail: "alex.rivera@example.com",
      guestPhone: "304-555-0103",
      checkIn: addDays(today, 21),
      checkOut: addDays(today, 23),
      guestCount: 2,
      status: "pending",
      nightlyTotal: 378,
      cleaningFee: 65,
      taxAmount: 26.58,
      totalPrice: 469.58,
      paymentMode: "request",
      specialRequests: "Late check-in around 6 PM if possible.",
    },
    {
      rentalId: willowLake!.id,
      guestName: "Emily Watson",
      guestEmail: "emily.w@example.com",
      guestPhone: "304-555-0104",
      checkIn: addDays(today, 45),
      checkOut: addDays(today, 48),
      guestCount: 3,
      status: "confirmed",
      nightlyTotal: 687,
      cleaningFee: 75,
      taxAmount: 45.72,
      totalPrice: 807.72,
      paymentMode: "deposit",
      stripePaymentIntentId: "demo_pi_deposit",
    },
    {
      rentalId: mapleRidge!.id,
      guestName: "Michael Brooks",
      guestEmail: "m.brooks@example.com",
      guestPhone: "304-555-0105",
      checkIn: addDays(today, 60),
      checkOut: addDays(today, 63),
      guestCount: 5,
      status: "cancelled",
      nightlyTotal: 807,
      cleaningFee: 85,
      taxAmount: 53.52,
      totalPrice: 945.52,
      paymentMode: "full",
      refundNote: "Guest cancelled — full refund issued.",
    },
  ]);

  await db.insert(siteSettingsTable).values({ key: "payment_mode", value: "full" });

  console.log("Demo seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
