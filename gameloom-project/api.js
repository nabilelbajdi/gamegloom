const BASE_URL = "http://localhost:8000"; 

export async function fetchAnticipatedGames() {
  try {
    const response = await fetch(`${BASE_URL}/anticipated-games`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.map((game) => ({
      title: game.name,
      genre: game.genres?.[0]?.name || "Unknown",
      rating: game.rating ? (game.rating / 20).toFixed(1) : "N/A",
      coverImage: game.cover?.url.replace("t_thumb", "t_cover_big") || "",
    }));
  } catch (error) {
    console.error("Error fetching anticipated games:", error);
    return [];
  }
}

export async function fetchHighlyRatedGames() {
  try {
    const response = await fetch(`${BASE_URL}/highly-rated-games`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.map((game) => ({
      title: game.name,
      genre: game.genres?.[0]?.name || "Unknown",
      rating: game.rating ? (game.rating / 20).toFixed(1) : "N/A",
      coverImage: game.cover?.url.replace("t_thumb", "t_cover_big") || "",
    }));
  } catch (error) {
    console.error("Error fetching anticipated games:", error);
    return [];
  }
}

export async function fetchLatestGames() {
  try {
    const response = await fetch(`${BASE_URL}/latest-games`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.map((game) => ({
      title: game.name,
      genre: game.genres?.[0]?.name || "Unknown",
      rating: game.rating ? (game.rating / 20).toFixed(1) : "N/A",
      coverImage: game.cover?.url.replace("t_thumb", "t_cover_big") || "",
    }));
  } catch (error) {
    console.error("Error fetching latest games:", error);
    return [];
  }
}