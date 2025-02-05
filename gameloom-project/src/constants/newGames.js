import eldenRingCover from "../assets/images/game-covers/elden-ring.jpg";
import baldurGateCover from "../assets/images/game-covers/baldurs-gate-3.png";
import overwatchCover from "../assets/images/game-covers/overwatch.jpg";
import cyberpunkCover from "../assets/images/game-covers/cyberpunk2077.jpg";
import gta6Cover from "../assets/images/game-covers/gta6.png";
import residentEvil4Cover from "../assets/images/game-covers/resident-evil-4.jpg";
import witcher3Cover from "../assets/images/game-covers/witcher3.jpg";

const featuredGames = [
  {
    title: "Cyberpunk 2077",
    coverImage: cyberpunkCover,
    genre: "Action RPG",
    rating: 4.8,
  },
  {
    title: "The Witcher 3: Wild Hunt",
    coverImage: witcher3Cover,
    genre: "RPG",
    rating: 4.9,
  },
  {
    title: "Resident Evil 4",
    coverImage: residentEvil4Cover,
    genre: "Survival Horror",
    rating: 4.8,
    status: "Played",
  },
  {
    title: "Overwatch",
    coverImage: overwatchCover,
    genre: "Shooter",
    rating: 4.9,
  },
  {
    title: "GTA 6",
    coverImage: gta6Cover,
    genre: "Action-Adventure",
    rating: undefined,
  },
  {
    title: "Baldur's Gate 3",
    coverImage: baldurGateCover,
    genre: "RPG",
    rating: 4.9,
  },
  {
    title: "Elden Ring",
    coverImage: eldenRingCover,
    genre: "RPG",
    rating: 4.8,
  },
];

export default featuredGames;
