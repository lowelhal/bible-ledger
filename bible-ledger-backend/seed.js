const API_URL = 'http://127.0.0.1:3000/v1';

async function seed() {
  console.log("Seeding data...");

  const userId = "user-123";

  // 1. Seed Ledger Entries (Reading Sessions)
  const entries = [
    {
      user_id: userId,
      source: "USER_WEB",
      start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60000).toISOString(),
      translation_id: "KJV",
      tags: ["Devotional"],
      passage: { book: "John", chapter: 1, start_verse: 1, end_verse: 14 }
    },
    {
      user_id: userId,
      source: "USER_WEB",
      start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60000).toISOString(),
      translation_id: "BSB",
      tags: ["Study"],
      passage: { book: "John", chapter: 2, start_verse: 1, end_verse: 25 }
    },
    {
      user_id: userId,
      source: "USER_WEB",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 5 * 60000).toISOString(),
      translation_id: "KJV",
      tags: ["Morning Reading"],
      passage: { book: "John", chapter: 3, start_verse: 1, end_verse: 16 }
    }
  ];

  for (const entry of entries) {
    const res = await fetch(`${API_URL}/ledger-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    console.log(`Created ledger entry: ${res.status}`);
  }

  // 2. Seed Notes
  const notes = [
    {
      user_id: userId,
      content: "This passage really highlights the beginning of the Word.",
      passage: { book: "John", chapter: 1, start_verse: 1, end_verse: 1 },
      tags: ["Creation"]
    },
    {
      user_id: userId,
      content: "The first miracle at Cana.",
      passage: { book: "John", chapter: 2, start_verse: 1, end_verse: 1 },
      tags: ["Miracles"]
    }
  ];

  for (const note of notes) {
    const res = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    console.log(`Created note: ${res.status}`);
  }

  // 3. Seed Highlights
  const highlights = [
    {
      user_id: userId,
      color_hex: "#fbbf24",
      passage: { book: "John", chapter: 3, start_verse: 16, end_verse: 16 }
    }
  ];

  for (const highlight of highlights) {
    const res = await fetch(`${API_URL}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highlight)
    });
    console.log(`Created highlight: ${res.status}`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
