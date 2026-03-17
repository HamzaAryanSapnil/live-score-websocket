// import { eq } from "drizzle-orm";
// import { db, pool } from "./db.js";
// import { demoUsers } from "./schema.js";

// async function main() {
//   try {
//     console.log("CRUD operations শুরু হচ্ছে...\n");

//     // CREATE: নতুন user insert করা
//     const [newUser] = await db
//       .insert(demoUsers)
//       .values({ name: "Admin User", email: "admin@example.com" })
//       .returning();

//     if (!newUser) {
//       throw new Error("User তৈরি করতে ব্যর্থ");
//     }
//     console.log("✅ CREATE: নতুন user তৈরি হয়েছে:", newUser);

//     // READ: User খুঁজে বের করা
//     const foundUser = await db
//       .select()
//       .from(demoUsers)
//       .where(eq(demoUsers.id, newUser.id));
//     console.log("✅ READ: User পাওয়া গেছে:", foundUser[0]);

//     // UPDATE: User এর নাম পরিবর্তন করা
//     const [updatedUser] = await db
//       .update(demoUsers)
//       .set({ name: "Super Admin" })
//       .where(eq(demoUsers.id, newUser.id))
//       .returning();

//     if (!updatedUser) {
//       throw new Error("User আপডেট করতে ব্যর্থ");
//     }
//     console.log("✅ UPDATE: User আপডেট হয়েছে:", updatedUser);

//     // DELETE: User মুছে ফেলা
//     await db.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
//     console.log("✅ DELETE: User মুছে ফেলা হয়েছে।");

//     console.log("\n🎉 সব CRUD operations সফলভাবে সম্পন্ন হয়েছে!");
//   } catch (error) {
//     console.error("❌ Error:", error);
//     process.exit(1);
//   } finally {
//     // Connection pool বন্ধ করা
//     if (pool) {
//       await pool.end();
//       console.log("Database connection বন্ধ হয়েছে।");
//     }
//   }
// }

// main();
