import poe2Cover from "../assets/images/game-covers/poe2.jpg";
import marvelRivalsCover from "../assets/images/game-covers/marvel-rivals.jpg";
import overwatchCover from "../assets/images/game-covers/overwatch.jpg";
import cyberpunkCover from "../assets/images/game-covers/cyberpunk2077.jpg";
import gta6Cover from "../assets/images/game-covers/gta6.png";
import residentEvil4Cover from "../assets/images/game-covers/resident-evil-4.jpg";
import witcher3Cover from "../assets/images/game-covers/witcher3.jpg";

const trendingGames = [
    
{
    title: "Path of Exile 2",
    coverImage: poe2Cover,
    genre: "Action RPG",
    rating: 4.7,
  },
  {
    title: "Marvel Rivals",
    coverImage: marvelRivalsCover,
    genre: "Shooter",
    rating: 4.5,
  },

  {
    title: "Overwatch",
    coverImage: overwatchCover,
    genre: "Shooter",
    rating: 4.9,
  },
  {
    title: "Cyberpunk 2077",
    coverImage: cyberpunkCover,
    genre: "Action RPG",
    rating: 4.8,
  },
  
  {
    title: "GTA 6",
    coverImage: gta6Cover,
    genre: "Action-Adventure",
    rating: undefined,
  },

  {
    title: "Resident Evil 4",
    coverImage: residentEvil4Cover,
    genre: "Survival Horror",
    rating: 4.8,
    status: "Played",
  },

    {
    title: "The Witcher 3: Wild Hunt",
    coverImage: witcher3Cover,
    genre: "RPG",
    rating: 4.9,
  },
];

export default trendingGames;
