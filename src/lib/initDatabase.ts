// utils/initDatabase.ts
import { database } from "./firebase";
import { ref, set } from "firebase/database";

export const initializeDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");
    
    // Create required nodes with initial data
    const initialData = {
      products: {
        "_sample": {
          sku: "SAMPLE-001",
          barcode: "SAMPLE-BAR-001",
          name: "Sample Gold Necklace",
          category: "Necklace",
          metal_type: "Gold 22K",
          weight: 25.5,
          stock: 10,
          purchase_price: 0,
          unit_price: 45000,
          status: "In Stock"
        }
      },
      shared: {
        products: {
          "_shared_sample": {
            sku: "SHARED-001",
            barcode: "SHARED-BAR-001",
            name: "Shared Sample Product",
            category: "Ring",
            metal_type: "Gold 22K",
            weight: 15.2,
            stock: 5,
            purchase_price: 0,
            unit_price: 28000,
            status: "In Stock"
          }
        }
      },
      settings: {
        storeName: "Shree Jewellers ERP",
        currency: "INR",
        timezone: "Asia/Kolkata"
      },
      metalPrices: {
        gold_24k: 7500,
        gold_22k: 7000,
        gold_18k: 5500,
        silver: 85,
        platinum: 4200
      }
    };

    // Write all initial data
    for (const [path, data] of Object.entries(initialData)) {
      const refPath = ref(database, path);
      await set(refPath, data);
      console.log(`✅ Created ${path} node`);
    }

    console.log("✅ Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    return false;
  }
};

// Call this function once to set up your database
// initializeDatabase();